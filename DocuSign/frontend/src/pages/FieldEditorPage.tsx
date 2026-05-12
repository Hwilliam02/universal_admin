import React, { useEffect, useState } from "react";
import PdfKonvaEditor, { FieldType } from "../components/PdfKonvaEditor";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { useAppSelector } from "../store/hooks";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { ArrowLeft, Lock, CheckCircle2, Copy, Check, PenTool, Send, User, Calendar, Type } from "lucide-react";
import { copyToClipboard } from "../lib/clipboard";
import { buildSigningLink } from "../lib/helpers";
import { notifyApiError } from "../lib/notify";

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode; color: string; bg: string; border: string }[] = [
  { type: "signature", label: "Signature", icon: <PenTool className="h-4 w-4 mr-2" />, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  { type: "text",      label: "Text",      icon: <Type className="h-4 w-4 mr-2" />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { type: "date",      label: "Date",      icon: <Calendar className="h-4 w-4 mr-2" />, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { type: "name",      label: "Name",      icon: <User className="h-4 w-4 mr-2" />, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
];

const FieldEditorPage: React.FC = () => {
  const [documentId, setDocumentId]   = useState("");
  const [envelopeId, setEnvelopeId]   = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [creating, setCreating]       = useState(false);
  const [activeType, setActiveType]   = useState<FieldType>("signature");
  const [signingLink, setSigningLink] = useState<string | null>(null);
  const [docTitle, setDocTitle]       = useState("");
  const [signMode, setSignMode]       = useState<"choose" | "self" | "other" | "both">("choose");
  const [linkCopied, setLinkCopied]   = useState(false);
  const [isPreview, setIsPreview]     = useState(false);
  const [fieldsSaved, setFieldsSaved] = useState(false);
  const [blocked, setBlocked]         = useState(false);

  // "both" mode state
  const [adminEnvelopeId, setAdminEnvelopeId] = useState("");
  const [signerEnvelopeId, setSignerEnvelopeId] = useState("");
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [signerTokenBoth, setSignerTokenBoth] = useState<string | null>(null);
  const [bothStep, setBothStep] = useState<"admin-fields" | "signer-fields" | "done">("admin-fields");
  const [signerLinkCopied, setSignerLinkCopied] = useState(false);

  const location  = useLocation();
  const navigate  = useNavigate();
  const me = useAppSelector((s) => s.user.user);

  // Pre-fill from URL query params
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const d  = qp.get("documentId");
    const e  = qp.get("envelopeId");
    const t  = qp.get("token") || qp.get("signingToken");
    const pv = qp.get("preview") === "true";
    const mode = qp.get("mode") as "self" | "other" | "both" | null;
    if (d) setDocumentId(d);
    if (pv) setIsPreview(true);
    if (e) setEnvelopeId(e);
    if (t) setSigningLink(buildSigningLink(t));
    if (mode) setSignMode(mode);
    if (me?.email) setSignerEmail(me.email);

    // Restore "both" mode state from URL
    const aEid = qp.get("adminEnvelopeId");
    const sEid = qp.get("signerEnvelopeId");
    const aTok = qp.get("adminToken");
    const sTok = qp.get("signerToken");
    if (mode === "both" && aEid && sEid && aTok && sTok) {
      setAdminEnvelopeId(aEid);
      setSignerEnvelopeId(sEid);
      setAdminToken(aTok);
      setSignerTokenBoth(sTok);
      if (!e) setEnvelopeId(aEid);
    }
  }, [location.search, me]);

  // Fetch doc title + check if already signed
  useEffect(() => {
    if (!documentId) return;
    api.get(`/documents/${documentId}`)
      .then((r) => {
        setDocTitle(r.data.title || r.data.originalFilename || "");
        if ((r.data.status === "signed" || r.data.status === "partially_signed") && !isPreview) {
          setBlocked(true);
        }
      })
      .catch(() => {});
  }, [documentId, isPreview]);

  const createEnvelope = async () => {
    if (!signerEmail) return;
    setCreating(true);
    try {
      if (signMode === "both") {
        const resp = await api.post("/sign/envelope", { documentId, signerEmail, signMode: "both" });
        const data = resp.data;
        const aEid = data.adminEnvelope.envelopeId as string;
        const sEid = data.signerEnvelope.envelopeId as string;
        const aTok = data.adminEnvelope.token as string;
        const sTok = data.signerEnvelope.token as string;
        setAdminEnvelopeId(aEid);
        setSignerEnvelopeId(sEid);
        setAdminToken(aTok);
        setSignerTokenBoth(sTok);
        setEnvelopeId(aEid); // Start with admin's envelope
        setSigningLink(buildSigningLink(aTok));
        setBothStep("admin-fields");
        navigate(`/field-editor?documentId=${documentId}&mode=both&envelopeId=${aEid}&adminEnvelopeId=${aEid}&signerEnvelopeId=${sEid}&adminToken=${aTok}&signerToken=${sTok}`, { replace: true });
      } else {
        const resp = await api.post("/sign/envelope", { documentId, signerEmail, signMode: signMode === "choose" ? undefined : signMode });
        const eid = resp.data.envelopeId as string;
        const tok = resp.data.token as string;
        setEnvelopeId(eid);
        setSigningLink(buildSigningLink(tok));
        navigate(`/field-editor?documentId=${documentId}&envelopeId=${eid}&token=${tok}&mode=${signMode}`, { replace: true });
      }
    } catch (err: any) {
      notifyApiError(err, "Failed to create envelope");
    } finally {
      setCreating(false);
    }
  };

  if (blocked) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-4 rounded-full">
            <Lock className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Document Already Signed</h2>
        <p className="text-slate-500 mb-6">This document has already been signed and cannot be edited.</p>
        <Button onClick={() => navigate("/documents")} className="bg-indigo-600 hover:bg-indigo-700">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Documents
        </Button>
      </div>
    );
  }

  if (!documentId) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Field Editor</h2>
        <p className="text-red-500 mb-6">No document ID provided.</p>
        <Button onClick={() => navigate("/documents")} variant="outline">
          Go to My Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => navigate("/documents")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 m-0">
            {isPreview ? "Document Preview" : "Field Editor"}
          </h2>
          {docTitle && <div className="text-slate-500 text-sm mt-1">{docTitle}</div>}
        </div>
      </div>

      {/* Preview mode: just show the PDF */}
      {isPreview && (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <PdfKonvaEditor
              documentId={documentId}
              envelopeId=""
              readOnly
            />
          </CardContent>
        </Card>
      )}

      {/* Editor mode */}
      {!isPreview && (
        <div className="space-y-6">
          {/* Envelope setup (shown when no envelope yet) */}
          {!envelopeId && (
            <Card className="max-w-2xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Step 1 — Who will sign this document?</CardTitle>
                <CardDescription>Choose whether you are signing or sending to someone else.</CardDescription>
              </CardHeader>
              <CardContent>
                {signMode === "choose" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => { setSignMode("self"); setSignerEmail(me?.email || ""); }}
                      className="flex flex-col items-start p-5 border-2 border-indigo-500 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors text-left"
                    >
                      <div className="flex items-center font-bold text-indigo-700 mb-1">
                        <PenTool className="h-5 w-5 mr-2" /> Sign Myself
                      </div>
                      <div className="text-sm text-indigo-600/80">I want to sign this document myself</div>
                    </button>
                    <button
                      onClick={() => { setSignMode("other"); setSignerEmail(""); }}
                      className="flex flex-col items-start p-5 border-2 border-amber-500 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors text-left"
                    >
                      <div className="flex items-center font-bold text-amber-700 mb-1">
                        <Send className="h-5 w-5 mr-2" /> Send to Someone
                      </div>
                      <div className="text-sm text-amber-600/80">Generate a signing link for another person</div>
                    </button>
                    <button
                      onClick={() => { setSignMode("both"); setSignerEmail(""); }}
                      className="flex flex-col items-start p-5 border-2 border-purple-500 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors text-left"
                    >
                      <div className="flex items-center font-bold text-purple-700 mb-1">
                        <User className="h-5 w-5 mr-2" /> Both Sign
                      </div>
                      <div className="text-sm text-purple-600/80">Both you and another person will sign</div>
                    </button>
                  </div>
                )}

                {signMode === "self" && (
                  <div className="space-y-4">
                    <Alert className="bg-slate-50 border-slate-200">
                      <AlertDescription className="text-slate-600">
                        An envelope will be created for <strong className="text-slate-900">{me?.email}</strong>. After adding fields you can sign the document directly.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setSignMode("choose")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Button
                        onClick={createEnvelope}
                        disabled={creating}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {creating ? "Creating…" : "Create Envelope & Add Fields"}
                      </Button>
                    </div>
                  </div>
                )}

                {signMode === "other" && (
                  <div className="space-y-4">
                    <Alert className="bg-slate-50 border-slate-200">
                      <AlertDescription className="text-slate-600">
                        Enter the email of the person who will sign. A shareable link will be generated for them.
                      </AlertDescription>
                    </Alert>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" onClick={() => setSignMode("choose")} className="shrink-0">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Input
                        type="email"
                        placeholder="signer@example.com"
                        value={signerEmail}
                        onChange={(e) => setSignerEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={createEnvelope}
                        disabled={creating || !signerEmail}
                        className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                      >
                        {creating ? "Creating…" : "Create Envelope"}
                      </Button>
                    </div>
                  </div>
                )}

                {signMode === "both" && (
                  <div className="space-y-4">
                    <Alert className="bg-purple-50 border-purple-200">
                      <AlertDescription className="text-purple-700">
                        Two envelopes will be created — one for <strong className="text-purple-900">{me?.email}</strong> and one for the other signer.
                        You'll draw fields for each signer separately.
                      </AlertDescription>
                    </Alert>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" onClick={() => setSignMode("choose")} className="shrink-0">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Input
                        type="email"
                        placeholder="other-signer@example.com"
                        value={signerEmail}
                        onChange={(e) => setSignerEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={createEnvelope}
                        disabled={creating || !signerEmail || signerEmail.toLowerCase() === (me?.email || "").toLowerCase()}
                        className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                      >
                        {creating ? "Creating…" : "Create Envelopes"}
                      </Button>
                    </div>
                    {signerEmail && signerEmail.toLowerCase() === (me?.email || "").toLowerCase() && (
                      <p className="text-sm text-red-600">Signer email must be different from your own email.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* "Both" mode step indicator */}
          {signMode === "both" && envelopeId && !fieldsSaved && (
            <Alert className={bothStep === "admin-fields" ? "bg-indigo-50 border-indigo-200" : "bg-amber-50 border-amber-200"}>
              <AlertDescription className={bothStep === "admin-fields" ? "text-indigo-800" : "text-amber-800"}>
                {bothStep === "admin-fields" ? (
                  <>Step 2a — Draw fields for <strong>yourself</strong> ({me?.email}). Click &quot;Save Fields&quot; when done.</>
                ) : (
                  <>Step 2b — Now draw fields for <strong>{signerEmail}</strong>. Click &quot;Save Fields&quot; when done.</>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Field type toolbar */}
          {envelopeId && !fieldsSaved && (
            <Card className="border-slate-200 shadow-sm sticky top-4 z-10">
              <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Draw Field:</span>
                {FIELD_TYPES.map(({ type, label, icon, color, bg, border }) => {
                  const isActive = activeType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveType(type)}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                        isActive 
                          ? `${bg} ${border} ${color} shadow-sm` 
                          : `border-transparent text-slate-600 hover:bg-slate-100`
                      }`}
                    >
                      {icon}
                      {label}
                    </button>
                  );
                })}
                <div className="ml-auto text-xs text-slate-400 hidden sm:block">
                  Drag on the PDF to add a field
                </div>
              </CardContent>
            </Card>
          )}

          {/* PDF Editor */}
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <PdfKonvaEditor
                key={envelopeId}
                documentId={documentId}
                envelopeId={envelopeId}
                readOnly={fieldsSaved}
                activeType={activeType}
                onSave={() => {
                  if (signMode === "both" && bothStep === "admin-fields") {
                    // Switch to signer's envelope for step 2b
                    setBothStep("signer-fields");
                    setEnvelopeId(signerEnvelopeId);
                    navigate(`/field-editor?documentId=${documentId}&mode=both&envelopeId=${signerEnvelopeId}&adminEnvelopeId=${adminEnvelopeId}&signerEnvelopeId=${signerEnvelopeId}&adminToken=${adminToken}&signerToken=${signerTokenBoth}`, { replace: true });
                  } else {
                    setFieldsSaved(true);
                    if (signMode === "both") setBothStep("done");
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* After saving: show appropriate action */}
          {fieldsSaved && signingLink && (
            <Card className="border-emerald-200 bg-emerald-50 shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800 mb-6">Fields saved successfully!</h3>

                {signMode === "self" && (
                  <Button
                    size="lg"
                    onClick={() => navigate(signingLink!.replace(window.location.origin, ""))}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
                  >
                    <PenTool className="mr-2 h-5 w-5" /> Sign Now
                  </Button>
                )}

                {signMode === "other" && (
                  <div className="max-w-lg mx-auto">
                    <p className="text-emerald-700 mb-4">
                      Share this link with <strong className="font-semibold">{signerEmail}</strong> to sign:
                    </p>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-emerald-200 shadow-sm">
                      <code className="flex-1 text-sm text-emerald-800 truncate px-2">
                        {signingLink}
                      </code>
                      <Button
                        size="sm"
                        onClick={async () => {
                          await copyToClipboard(signingLink!, "Signing link");
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                      >
                        {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {linkCopied ? "Copied!" : "Copy Link"}
                      </Button>
                    </div>
                  </div>
                )}

                {signMode === "both" && adminToken && signerTokenBoth && (
                  <div className="space-y-6 max-w-lg mx-auto">
                    {/* Admin sign button */}
                    <div>
                      <p className="text-emerald-700 mb-3 font-medium">Your signing link:</p>
                      <Button
                        size="lg"
                        onClick={() => navigate(`/sign/${adminToken}`)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
                      >
                        <PenTool className="mr-2 h-5 w-5" /> Sign Now (Your Turn)
                      </Button>
                    </div>
                    {/* Other signer link */}
                    <div>
                      <p className="text-emerald-700 mb-3">
                        Share this link with <strong className="font-semibold">{signerEmail}</strong>:
                      </p>
                      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-emerald-200 shadow-sm">
                        <code className="flex-1 text-sm text-emerald-800 truncate px-2">
                          {buildSigningLink(signerTokenBoth)}
                        </code>
                        <Button
                          size="sm"
                          onClick={async () => {
                            await copyToClipboard(buildSigningLink(signerTokenBoth), "Signing link");
                            setSignerLinkCopied(true);
                            setTimeout(() => setSignerLinkCopied(false), 2000);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                        >
                          {signerLinkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                          {signerLinkCopied ? "Copied!" : "Copy Link"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Before saving: show envelope creation confirmation */}
          {!fieldsSaved && envelopeId && signMode !== "both" && (
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                Envelope created for <strong className="font-semibold">{signerEmail}</strong>. Draw fields on the PDF above, then click <strong>&quot;Save Fields&quot;</strong> to continue.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

export default FieldEditorPage;
