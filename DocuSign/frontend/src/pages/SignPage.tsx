import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import PdfKonvaEditor, { Field } from "../components/PdfKonvaEditor";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { AlertCircle, CheckCircle2, Download, Copy, PenTool, FileSignature, X, Upload } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { copyToClipboard } from "../lib/clipboard";
import { notifyError, notifyApiError } from "../lib/notify";

interface EnvelopeInfo {
  envelopeId: string;
  documentId: string;
  documentTitle: string;
  signerEmail: string;
  status: string;
}

/* ── Allowed upload constraints ─────────────────────────────────── */
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/bmp", "image/webp"];
const ALLOWED_UPLOAD_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_FILE_SIZE_LABEL = "2 MB";

/* ── Inline SignaturePad with Draw / Upload tabs ───────────────── */
const SignaturePadModal: React.FC<{
  onDone: (dataUrl: string) => void;
  onClose: () => void;
  open: boolean;
}> = ({ onDone, onClose, open }) => {
  const [tab, setTab] = useState<"draw" | "upload">("draw");

  // ─── Draw state ───
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing   = useRef(false);

  /** Get (offsetX, offsetY) from either mouse or touch event */
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0] || (e as any).changedTouches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).nativeEvent.offsetX, y: (e as React.MouseEvent).nativeEvent.offsetY };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#1a1f36";
    ctx.moveTo(x, y);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const end = () => { drawing.current = false; };
  const clear = () => {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
  };

  // ─── Upload state ───
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const resetUpload = () => {
    setUploadPreview(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /** Convert a single-page PDF to a data URL via pdfjs + canvas */
  const pdfToDataUrl = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    if (pdf.numPages > 1) {
      throw new Error("PDF has multiple pages. Please upload a single-page signature file.");
    }
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/png");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // ── Validation checks ──
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      setUploadError(`Invalid file type "${file.type}". Please upload an image (PNG, JPG, GIF, BMP, WebP) or a single-page PDF.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_LABEL}.`);
      return;
    }

    setUploading(true);
    try {
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const dataUrl = await pdfToDataUrl(arrayBuffer);
        setUploadPreview(dataUrl);
      } else {
        // Image file — load via Image + canvas to normalise to PNG
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const img = new window.Image();
          img.onload = () => {
            // Re-draw onto a canvas to guarantee a PNG data URL regardless
            // of source format (gif, bmp, webp, jpg, etc.)
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0);
            const pngDataUrl = canvas.toDataURL("image/png");
            setUploadPreview(pngDataUrl);
            setUploading(false);
          };
          img.onerror = () => {
            setUploadError("The selected file could not be loaded as an image.");
            setUploading(false);
          };
          img.src = dataUrl;
        };
        reader.onerror = () => {
          setUploadError("Failed to read the file.");
          setUploading(false);
        };
        reader.readAsDataURL(file);
        return; // Async — setUploading(false) handled in callbacks
      }
    } catch (err: any) {
      setUploadError(err?.message || "Failed to process the file.");
    } finally {
      setUploading(false);
    }
  };

  // Reset state when modal closes / tab switches
  useEffect(() => {
    if (!open) {
      setTab("draw");
      resetUpload();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 24,
          width: "90%",
          maxWidth: 540,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 12,
            background: "none", border: "none", cursor: "pointer",
            padding: 4, borderRadius: 4, display: "flex",
          }}
        >
          <X size={18} color="#94a3b8" />
        </button>

        <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600, color: "#0f172a" }}>
          Add Your Signature
        </h3>

        {/* ── Tab switcher ── */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #e2e8f0" }}>
          <button
            onClick={() => { setTab("draw"); resetUpload(); }}
            style={{
              flex: 1,
              padding: "10px 0",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              borderBottom: tab === "draw" ? "2px solid #4f46e5" : "2px solid transparent",
              marginBottom: -2,
              background: "none",
              color: tab === "draw" ? "#4f46e5" : "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            <PenTool size={16} /> Draw Signature
          </button>
          <button
            onClick={() => { setTab("upload"); clear(); }}
            style={{
              flex: 1,
              padding: "10px 0",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              borderBottom: tab === "upload" ? "2px solid #4f46e5" : "2px solid transparent",
              marginBottom: -2,
              background: "none",
              color: tab === "upload" ? "#4f46e5" : "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            <Upload size={16} /> Upload Signature
          </button>
        </div>

        {/* ── Draw tab ── */}
        {tab === "draw" && (
          <>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748b" }}>
              Draw your signature in the box below.
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <canvas
                ref={canvasRef}
                width={460}
                height={160}
                onMouseDown={start}
                onMouseMove={move}
                onMouseUp={end}
                onMouseLeave={end}
                onTouchStart={start}
                onTouchMove={move}
                onTouchEnd={end}
                style={{
                  border: "2px solid #cbd5e1",
                  borderRadius: 8,
                  cursor: "crosshair",
                  backgroundColor: "#fff",
                  display: "block",
                  maxWidth: "100%",
                  touchAction: "none",
                }}
              />
            </div>
            <div style={{
              display: "flex", flexDirection: "row", justifyContent: "flex-end",
              gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0",
            }}>
              <Button variant="outline" size="sm" onClick={clear}>Clear</Button>
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={() => onDone(canvasRef.current!.toDataURL("image/png"))}>
                Apply Signature
              </Button>
            </div>
          </>
        )}

        {/* ── Upload tab ── */}
        {tab === "upload" && (
          <>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748b" }}>
              Upload your signature as an image (PNG, JPG, GIF, BMP, WebP) or a <strong>single-page</strong> PDF.
              Maximum file size: {MAX_FILE_SIZE_LABEL}.
            </p>

            {/* Drop zone / file picker */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed #cbd5e1",
                borderRadius: 8,
                padding: uploadPreview ? 12 : 32,
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "#f8fafc",
                transition: "border-color 0.15s, background-color 0.15s",
                minHeight: 160,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files.length > 0 && fileInputRef.current) {
                  const dt = new DataTransfer();
                  dt.items.add(e.dataTransfer.files[0]);
                  fileInputRef.current.files = dt.files;
                  fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.gif,.bmp,.webp,.pdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />

              {uploading && (
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Processing file…</p>
              )}

              {!uploading && !uploadPreview && (
                <>
                  <Upload size={32} color="#94a3b8" />
                  <p style={{ color: "#64748b", fontSize: 13, margin: "8px 0 0" }}>
                    Click to browse or drag & drop your signature file
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: 11, margin: "4px 0 0" }}>
                    PNG, JPG, GIF, BMP, WebP or single-page PDF &middot; Max {MAX_FILE_SIZE_LABEL}
                  </p>
                </>
              )}

              {!uploading && uploadPreview && (
                <img
                  src={uploadPreview}
                  alt="Signature preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 140,
                    objectFit: "contain",
                    borderRadius: 4,
                  }}
                />
              )}
            </div>

            {/* Error message */}
            {uploadError && (
              <div style={{
                marginTop: 8,
                padding: "8px 12px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
                color: "#dc2626",
                fontSize: 12,
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
              }}>
                <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>{uploadError}</span>
              </div>
            )}

            <div style={{
              display: "flex", flexDirection: "row", justifyContent: "flex-end",
              gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0",
            }}>
              <Button variant="outline" size="sm" onClick={() => { resetUpload(); }}>
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button
                size="sm"
                disabled={!uploadPreview}
                onClick={() => { if (uploadPreview) onDone(uploadPreview); }}
              >
                Apply Signature
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Text/Date/Name input modal ─────────────────────────────────── */
const TextInputModal: React.FC<{
  field: Field;
  onDone: (value: string) => void;
  onClose: () => void;
  open: boolean;
}> = ({ field, onDone, onClose, open }) => {
  const [value, setValue] = useState("");
  const typeLabel = field.type === "date" ? "Date" : field.type === "name" ? "Full Name" : "Text";

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 24,
          width: "90%",
          maxWidth: 400,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 12,
            background: "none", border: "none", cursor: "pointer",
            padding: 4, borderRadius: 4, display: "flex",
          }}
        >
          <X size={18} color="#94a3b8" />
        </button>

        <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600, color: "#0f172a" }}>
          Enter {typeLabel}
        </h3>

        <Input
          type={field.type === "date" ? "date" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          placeholder={`Enter ${typeLabel.toLowerCase()}...`}
        />

        <div style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid #e2e8f0",
        }}>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => value && onDone(value)}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ── Main SignPage ───────────────────────────────────────────────── */
const SignPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [info, setInfo]               = useState<EnvelopeInfo | null>(null);
  const [fields, setFields]           = useState<Field[]>([]);
  const [signedFields, setSignedFields] = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [justSigned, setJustSigned]   = useState(false);  // success state after submit
  const [pdfKey, setPdfKey]           = useState(0);     // bump to force PdfKonvaEditor reload

  // Modal state
  const [sigModal, setSigModal]       = useState(false);
  const [textModal, setTextModal]     = useState<Field | null>(null);
  const [pendingField, setPendingField] = useState<Field | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [infoResp, fieldsResp] = await Promise.all([
          api.get(`/sign/${token}`),
          api.get(`/sign/${token}/fields`),
        ]);
        setInfo(infoResp.data as EnvelopeInfo);
        setFields(fieldsResp.data as Field[]);
      } catch (err: any) {
        if (err?.response?.data?.message) {
          // Backend returned a clear error (e.g. token expired, already signed)
          setError(err.response.data.message);
        } else {
          // Network / CORS / firewall / unknown error — show connectivity hint
          setError(
            "Unable to load the signing page. If you are on a different device " +
            "(e.g. mobile), make sure the server at " +
            `${window.location.protocol}//${window.location.hostname}:4000 ` +
            "is reachable and that no firewall is blocking the connection."
          );
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleFieldClick = (field: Field) => {
    // Block any interaction on already-signed documents
    if (info?.status === "signed") return;
    setPendingField(field);
    if (field.type === "signature") {
      setSigModal(true);
    } else {
      setTextModal(field);
    }
  };

  const applySignature = (dataUrl: string) => {
    if (!pendingField?._id) return;
    setSignedFields((prev) => ({ ...prev, [pendingField._id!]: dataUrl }));
    setSigModal(false);
    setPendingField(null);
  };

  const applyText = (value: string) => {
    if (!textModal?._id) return;
    setSignedFields((prev) => ({ ...prev, [textModal._id!]: value }));
    setTextModal(null);
    setPendingField(null);
  };

  const allFieldsSigned = fields.length === 0
    ? false
    : fields.every((f) => f._id && signedFields[f._id] !== undefined);

  const missingFields = fields.filter((f) => f._id && signedFields[f._id] === undefined);

  const submit = async () => {
    if (!token) return;

    // Validate every field is filled
    if (missingFields.length > 0) {
      const types = missingFields.map((f) => f.type).join(", ");
      notifyError("Incomplete fields", `Please complete all fields before submitting. Missing: ${types}`);
      return;
    }

    // Build per-field signature entries for all signature fields
    const fieldSignatures = fields
      .filter((f) => f.type === "signature" && f._id && signedFields[f._id])
      .map((f) => ({ fieldId: f._id!, data: signedFields[f._id!] }));

    if (fieldSignatures.length === 0) {
      notifyError("No signature", "Please sign at least one signature field before submitting.");
      return;
    }

    // Collect text / date / name field values to embed as text in the PDF
    const fieldValues = fields
      .filter((f) => f.type !== "signature" && f._id && signedFields[f._id])
      .map((f) => ({ fieldId: f._id!, type: f.type, value: signedFields[f._id!] }));

    setSubmitting(true);
    try {
      await api.post(`/sign/${token}`, {
        signatureBase64: fieldSignatures[0].data,  // primary (for record)
        fieldSignatures,                            // per-field signature images
        fieldValues,                                // text / date / name values
      });
      // Stay on the page — show success + download instead of redirecting
      setJustSigned(true);
      setInfo((prev) => prev ? { ...prev, status: "signed" } : prev);
      // Clear overlays and force PdfKonvaEditor to re-mount so it fetches
      // the signed PDF from the backend (which has signatures embedded).
      setSignedFields({});
      setFields([]);
      setPdfKey((k) => k + 1);
    } catch (err: any) {
      notifyApiError(err, "Failed to submit signature");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground animate-pulse">Loading document…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Unable to load document</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const downloadUrl = `${api.defaults.baseURL}/sign/${token}/signed-file`;

  const totalFields = fields.length;
  const signedCount = Object.keys(signedFields).length;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <Card className="bg-slate-900 text-slate-50 border-none">
        <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold m-0">{info?.documentTitle}</h2>
            <p className="text-slate-400 text-sm mt-1">Signing as: {info?.signerEmail}</p>
          </div>
          <Badge 
            variant={info?.status === "signed" ? "default" : "secondary"}
            className={info?.status === "signed" ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/20"}
          >
            {info?.status}
          </Badge>
        </CardContent>
      </Card>

      {/* Instructions */}
      {info?.status !== "signed" && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-900">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 font-semibold">How to sign</AlertTitle>
          <AlertDescription className="text-blue-800 mt-1">
            Click on the highlighted <span className="text-red-600 font-bold">red signature fields</span> on the PDF to draw your signature.
            Click other colored fields to fill in text values.
            {totalFields > 0 && (
              <span className="block mt-2 font-medium">
                Progress: {signedCount} / {totalFields} field{totalFields !== 1 ? "s" : ""} completed
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {info?.status === "signed" && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-6">
            {justSigned ? (
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-emerald-800 mb-2">Document Signed Successfully!</h3>
                <p className="text-emerald-700 text-sm">Your signature has been applied and the document is now sealed.</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-6">
                <CheckCircle2 className="w-5 h-5" />
                <span>This document has already been signed.</span>
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <a href={downloadUrl} download>
                  <Download className="w-4 h-4 mr-2" />
                  Download Signed PDF
                </a>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(downloadUrl, "Download link")}
                className="bg-white"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Download Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Editor (readOnly signing mode) */}
      {info && (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="bg-slate-100/50 p-4 border-b border-slate-200 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-slate-500" />
            <h3 className="font-medium text-slate-700">Document Viewer</h3>
          </div>
          <div className="p-0 bg-slate-50/50">
            <PdfKonvaEditor
              key={pdfKey}
              documentId={info.documentId}
              envelopeId={info.envelopeId}
              token={token}
              readOnly
              externalFields={info.status === "signed" ? [] : fields}
              signedFields={info.status === "signed" ? {} : signedFields}
              onFieldClick={info.status !== "signed" ? handleFieldClick : undefined}
            />
          </div>
        </Card>
      )}

      {/* Submit */}
      {info?.status !== "signed" && (
        <div className="flex flex-wrap items-center gap-4 pt-4">
          <Button
            size="lg"
            onClick={submit}
            disabled={submitting || !allFieldsSigned}
            className="w-full sm:w-auto text-base font-semibold px-8"
          >
            {submitting ? "Submitting…" : "✅ Finish & Submit"}
          </Button>
          
          {missingFields.length > 0 && !submitting && (
            <div className="flex items-center gap-2 text-amber-600 font-medium text-sm bg-amber-50 px-4 py-2 rounded-md border border-amber-200">
              <AlertCircle className="w-4 h-4" />
              <span>
                {missingFields.length} field{missingFields.length !== 1 ? "s" : ""} still need{missingFields.length === 1 ? "s" : ""} to be filled
                ({missingFields.map((f) => f.type).join(", ")})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <SignaturePadModal 
        open={sigModal}
        onDone={applySignature} 
        onClose={() => { setSigModal(false); setPendingField(null); }} 
      />
      
      {textModal && (
        <TextInputModal 
          open={!!textModal}
          field={textModal} 
          onDone={applyText} 
          onClose={() => { setTextModal(null); setPendingField(null); }} 
        />
      )}
    </div>
  );
};

export default SignPage;

