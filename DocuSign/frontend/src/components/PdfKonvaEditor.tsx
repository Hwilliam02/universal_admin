import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Text, Image as KonvaImage } from "react-konva";
import api from "../api";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { Button } from "./ui/button";

export type FieldType = "signature" | "text" | "date" | "name";

export interface Field {
  _id?: string;
  envelopeId: string;
  pageNumber: number;
  x: number;       // normalized 0..1
  y: number;
  width: number;
  height: number;
  type: FieldType;
}

interface Props {
  documentId: string;
  envelopeId: string;
  token?: string;
  readOnly?: boolean;
  /** activeType is only used in editing mode */
  activeType?: FieldType;
  onFieldClick?: (field: Field) => void;
  /** _id → signed value string (shown as overlay in readOnly mode) */
  signedFields?: Record<string, string>;
  /** When provided, skip internal field fetch and use these fields directly */
  externalFields?: Field[];
  /** Called after fields are successfully saved */
  onSave?: () => void;
}

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version}/pdf.worker.min.js`;

const COLORS: Record<FieldType, string> = {
  signature: "#ef4444",
  text: "#3b82f6",
  date: "#22c55e",
  name: "#f59e0b",
};

const LABELS: Record<FieldType, string> = {
  signature: "✍ Signature",
  text: "Text",
  date: "📅 Date",
  name: "👤 Name",
};

const PdfKonvaEditor: React.FC<Props> = ({
  documentId,
  envelopeId,
  token,
  readOnly = false,
  activeType = "signature",
  onFieldClick,
  signedFields = {},
  externalFields,
  onSave,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Original rendered PDF canvas dimensions (at full scale)
  const [pdfWidth, setPdfWidth] = useState<number>(800);
  const [pdfHeight, setPdfHeight] = useState<number>(600);
  const [fields, setFields] = useState<Field[]>([]);
  const [drawing, setDrawing] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Field | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const pdfRef = useRef<any>(null);
  // Cache loaded HTMLImageElement for each signed signature field
  const [imageCache, setImageCache] = useState<Record<string, HTMLImageElement>>({});

  // Responsive container width tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Display dimensions: scale down to fit container if needed
  const displayScale = containerWidth > 0 && containerWidth < pdfWidth
    ? containerWidth / pdfWidth
    : 1;
  const width = Math.floor(pdfWidth * displayScale);
  const height = Math.floor(pdfHeight * displayScale);

  // Load/refresh image elements whenever signedFields changes (for signature preview)
  useEffect(() => {
    const activeSignatureIds = new Set<string>();

    fields.forEach((f) => {
      if (f.type !== "signature" || !f._id) return;

      const fieldId = f._id;
      const dataUrl = signedFields[fieldId];
      if (!dataUrl) return;

      activeSignatureIds.add(fieldId);

      if (imageCache[fieldId]?.src === dataUrl) return;

      const img = new window.Image();
      img.onload = () => {
        setImageCache((prev) => {
          if (prev[fieldId]?.src === dataUrl) return prev;
          return { ...prev, [fieldId]: img };
        });
      };
      img.src = dataUrl;
    });

    const hasStaleEntries = Object.keys(imageCache).some((id) => !activeSignatureIds.has(id));
    if (hasStaleEntries) {
      setImageCache((prev) => {
        const next: Record<string, HTMLImageElement> = {};
        Object.entries(prev).forEach(([id, img]) => {
          if (activeSignatureIds.has(id)) next[id] = img;
        });
        return next;
      });
    }
  }, [signedFields, fields, imageCache]);

  // Sync externalFields prop into local state
  useEffect(() => {
    if (externalFields) setFields(externalFields);
  }, [externalFields]);

  const renderPage = async (pdf: any, pageNumber: number) => {
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      setPdfWidth(canvas.width);
      setPdfHeight(canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      setImageSrc(canvas.toDataURL("image/png"));
    } catch (e) {
      setError("Failed to render page");
    }
  };

  useEffect(() => {
    if (!documentId) return;
    const load = async () => {
      try {
        setError(null);

        // The axios interceptor in api/index.ts automatically attaches
        // the JWT Authorization header from the Redux store for every
        // request, so we don't need to handle auth headers manually.
        let arrayBuffer: ArrayBuffer;

        if (token) {
          // Signer path — token-based endpoint; no JWT needed
          const resp = await api.get(`/sign/${token}/file`, { responseType: "arraybuffer" });
          arrayBuffer = resp.data as ArrayBuffer;
        } else {
          // Sender path — need document record to get filename, then fetch the file
          const docResp = await api.get(`/documents/${documentId}`);
          const filename = docResp.data.originalFilename as string;
          const resp = await api.get(`/files/original/${filename}`, { responseType: "arraybuffer" });
          arrayBuffer = resp.data as ArrayBuffer;
        }

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        await renderPage(pdf, 1);

        if (envelopeId && !externalFields) {
          const fieldsResp = await api.get(`/fields/${envelopeId}`);
          setFields(fieldsResp.data as Field[]);
        }
      } catch (err: any) {
        const status = err?.response?.status;
        setError(
          status === 401 ? "Unauthorized — please log in again." :
          status === 404 ? "Document or file not found." :
          err?.message || "Failed to load PDF"
        );
      }
    };
    load();
  }, [documentId, envelopeId, token]);

  useEffect(() => {
    if (pdfRef.current) renderPage(pdfRef.current, currentPage);
  }, [currentPage]);

  const pageFields = fields.filter((f) => f.pageNumber === currentPage);

  // ── Drawing handlers (edit mode only) ────────────────────────────────
  const onMouseDown = (e: any) => {
    if (readOnly) return;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    startRef.current = pos;
    setDrawing(true);
    setCurrentRect({ envelopeId, pageNumber: currentPage, x: pos.x, y: pos.y, width: 0, height: 0, type: activeType });
  };

  const onMouseMove = (e: any) => {
    if (readOnly || !drawing || !startRef.current) return;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    const { x: sx, y: sy } = startRef.current;
    setCurrentRect({
      envelopeId, pageNumber: currentPage,
      x: Math.min(pos.x, sx), y: Math.min(pos.y, sy),
      width: Math.abs(pos.x - sx), height: Math.abs(pos.y - sy),
      type: activeType,
    });
  };

  const onMouseUp = () => {
    setDrawing(false);
    if (!readOnly && currentRect && currentRect.width > 10 && currentRect.height > 10) {
      const normalized: Field = {
        envelopeId, pageNumber: currentPage,
        x: currentRect.x / width,
        y: currentRect.y / height,
        width: currentRect.width / width,
        height: currentRect.height / height,
        type: activeType,
      };
      setFields((prev) => [...prev, normalized]);
    }
    setCurrentRect(null);
    startRef.current = null;
  };

  // ── Save to server ────────────────────────────────────────────────────
  const save = async (): Promise<Field[]> => {
    setSaving(true);
    try {
      const unsaved = fields.filter((f) => !f._id);
      for (const f of unsaved) {
        await api.post("/fields", f);
      }
      const resp = await api.get(`/fields/${envelopeId}`);
      const saved = resp.data as Field[];
      setFields(saved);
      if (onSave) onSave();
      return saved;
    } finally {
      setSaving(false);
    }
  };

  const deleteField = (idx: number) => {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  };

  // expose save via ref pattern not feasible here — use onSave prop if needed
  (PdfKonvaEditor as any).__saveRef = save;

  return (
    <div className="select-none">
      {/* Page navigation */}
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-slate-50 rounded-lg border border-slate-200">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            ‹
          </Button>
          <span className="text-sm font-medium text-slate-600 min-w-[80px] text-center">
            Page {currentPage} / {numPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))} 
            disabled={currentPage === numPages}
            className="h-8 w-8 p-0"
          >
            ›
          </Button>
        </div>
      )}

      {/* Responsive canvas wrapper */}
      <div ref={containerRef} className="w-full overflow-hidden rounded-lg border border-slate-200 shadow-sm bg-slate-100">
        <div 
          className="relative mx-auto"
          style={{ width, height }}
        >
        {imageSrc && (
          <img 
            src={imageSrc} 
            alt="pdf" 
            className="absolute top-0 left-0 block"
            style={{ width, height }} 
          />
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 text-red-600 p-6 text-sm font-medium text-center backdrop-blur-sm">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-red-100">
              ⚠ {error}
            </div>
          </div>
        )}
        
        {!error && (
          <div 
            className="absolute top-0 left-0"
            style={{ cursor: readOnly ? "default" : "crosshair" }}
          >
            <Stage
              width={width} height={height}
              onMouseDown={readOnly ? undefined : onMouseDown}
              onMouseMove={readOnly ? undefined : onMouseMove}
              onMouseUp={readOnly ? undefined : onMouseUp}
              onTouchStart={readOnly ? undefined : onMouseDown}
              onTouchMove={readOnly ? undefined : onMouseMove}
              onTouchEnd={readOnly ? undefined : onMouseUp}
            >
              <Layer>
                {pageFields.map((f, i) => {
                  const px = f.x * width;
                  const py = f.y * height;
                  const pw = f.width * width;
                  const ph = f.height * height;
                  const color = COLORS[f.type];
                  const isSigned = f._id ? signedFields[f._id] !== undefined : false;
                  const sigImg = f.type === "signature" && f._id ? imageCache[f._id] : null;

                  return (
                    <React.Fragment key={i}>
                      {/* Field background rectangle — always visible, always clickable before submission */}
                      <Rect
                        x={px} y={py} width={pw} height={ph}
                        fill={isSigned ? "transparent" : `${color}18`}
                        stroke={isSigned ? "#22c55e" : color}
                        strokeWidth={2}
                        cornerRadius={4}
                        onClick={() => readOnly && onFieldClick && onFieldClick(f)}
                        onTap={() => readOnly && onFieldClick && onFieldClick(f)}
                        onMouseEnter={(e: any) => { if (readOnly) e.target.getStage().container().style.cursor = "pointer"; }}
                        onMouseLeave={(e: any) => { if (readOnly) e.target.getStage().container().style.cursor = "default"; }}
                      />
                      {/* Signature: show drawn image; other types: show text */}
                      {isSigned && sigImg ? (
                        <KonvaImage
                          image={sigImg}
                          x={px} y={py}
                          width={pw} height={ph}
                          listening={false}
                        />
                      ) : isSigned ? (
                        <Text
                          x={px + 4} y={py + 4}
                          text={f.type === "signature" ? "✓ Signed" : (f._id ? signedFields[f._id] : "")}
                          fontSize={Math.max(10, Math.min(14, ph / 2.5))}
                          fill="#22c55e"
                          fontStyle="bold"
                          listening={false}
                        />
                      ) : (
                        <Text
                          x={px + 4} y={py + 4}
                          text={LABELS[f.type]}
                          fontSize={Math.max(10, Math.min(14, ph / 2.5))}
                          fill={color}
                          listening={false}
                        />
                      )}
                    </React.Fragment>
                  );
                })}

                {/* In-progress draw rect */}
                {currentRect && currentRect.width > 2 && (
                  <Rect
                    x={currentRect.x} y={currentRect.y}
                    width={currentRect.width} height={currentRect.height}
                    fill={`${COLORS[activeType]}22`}
                    stroke={COLORS[activeType]} strokeWidth={2}
                    dash={[6, 3]}
                  />
                )}
              </Layer>
            </Stage>
          </div>
        )}
        </div>
      </div>

      {/* Field list (edit mode only) */}
      {!readOnly && fields.filter((f) => f.pageNumber === currentPage).length > 0 && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
            Fields on Page {currentPage}
          </div>
          <div className="flex flex-wrap gap-2">
            {fields.map((f, i) =>
              f.pageNumber !== currentPage ? null : (
                <div 
                  key={i} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
                  style={{
                    backgroundColor: `${COLORS[f.type]}18`, 
                    borderColor: COLORS[f.type],
                    color: COLORS[f.type]
                  }}
                >
                  {LABELS[f.type]}
                  <button 
                    onClick={() => deleteField(i)} 
                    className="hover:bg-black/10 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                    style={{ color: COLORS[f.type] }}
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Save button (edit mode only) */}
      {!readOnly && envelopeId && (
        <div className="mt-6 flex justify-end">
          <Button
            onClick={save}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
          >
            {saving ? "Saving…" : "Save Fields"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PdfKonvaEditor;
