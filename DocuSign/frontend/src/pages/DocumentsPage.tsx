import React, { useEffect, useState } from "react";
import api from "../api";
import { useAppSelector } from "../store/hooks";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { FileText, Plus, Eye, Link as LinkIcon, Download, PenTool } from "lucide-react";
import { copyToClipboard } from "../lib/clipboard";
import { buildSigningLink, getStatusBadge, getEnvelopeForDoc, getEnvelopesForDoc, EnvelopeRef } from "../lib/helpers";
import { notifyApiError } from "../lib/notify";

interface Doc {
  _id: string;
  title?: string;
  originalFilename: string;
  status: string;
}

const DocumentsPage: React.FC = () => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [envelopes, setEnvelopes] = useState<EnvelopeRef[]>([]);
  const [loading, setLoading] = useState(false);
  const user = useAppSelector((s) => s.user.user);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [docsResp, envResp] = await Promise.all([
          api.get("/documents"),
          api.get("/sign/envelopes"),
        ]);
        setDocs(docsResp.data || []);
        setEnvelopes(envResp.data || []);
      } catch (err) {
        notifyApiError(err, "Failed to load documents");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getEnvelope = (documentId: string) => getEnvelopeForDoc(envelopes, documentId);
  const getEnvelopesAll = (documentId: string) => getEnvelopesForDoc(envelopes, documentId);

  const openEditor = (documentId: string) => {
    navigate(`/field-editor?documentId=${documentId}`);
  };

  const openPreview = (doc: Doc) => {
    navigate(`/field-editor?documentId=${doc._id}&preview=true`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">My Documents</h2>
          <p className="text-slate-500 mt-1">Manage and track all your uploaded documents.</p>
        </div>
        <Button onClick={() => navigate("/upload")} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Upload New
        </Button>
      </div>

      {loading && <div className="text-center py-12 text-slate-500">Loading documents...</div>}

      {!loading && docs.length === 0 && (
        <Card className="border-dashed border-2 bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No documents yet</h3>
            <p className="text-slate-500 mb-4">Upload a PDF to start sending it for signatures.</p>
            <Button onClick={() => navigate("/upload")} className="bg-indigo-600 hover:bg-indigo-700">
              Upload your first PDF
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {docs.map((d) => {
          const env = getEnvelope(d._id);
          const allEnvs = getEnvelopesAll(d._id);
          const isBothMode = allEnvs.length > 1 || allEnvs.some(e => e.signMode === "both");
          return (
            <Card key={d._id} className="overflow-hidden transition-all hover:shadow-md">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-50 p-3 rounded-lg hidden sm:block">
                      <FileText className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{d.title || d.originalFilename}</h3>
                      {d.title && <p className="text-sm text-slate-500 mt-0.5">{d.originalFilename}</p>}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {getStatusBadge(d.status)}
                        {isBothMode ? (
                          allEnvs.map((e) => (
                            <span key={e._id} className={`text-xs px-2 py-1 rounded-md ${e.status === "signed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {e.signerEmail} {e.status === "signed" ? "✓" : "(pending)"}
                            </span>
                          ))
                        ) : env && (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            Signer: <span className="font-medium text-slate-700">{env.signerEmail}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                    {d.status !== "signed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPreview(d)}
                        className="text-slate-600"
                      >
                        <Eye className="mr-2 h-4 w-4" /> Preview
                      </Button>
                    )}
                    {isBothMode && d.status !== "signed" ? (
                      allEnvs.filter(e => e.status !== "signed").map((e) => (
                        <Button
                          key={e._id}
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(buildSigningLink(e.signingToken), "Signing link")}
                          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        >
                          <LinkIcon className="mr-2 h-4 w-4" /> Link ({e.signerEmail.split("@")[0]})
                        </Button>
                      ))
                    ) : env && d.status !== "signed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(buildSigningLink(env.signingToken), "Signing link")}
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        <LinkIcon className="mr-2 h-4 w-4" /> Share Link
                      </Button>
                    )}
                    {d.status === "signed" && env && (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/sign/${env.signingToken}`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Download className="mr-2 h-4 w-4" /> Download Signed
                      </Button>
                    )}
                    {d.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => openEditor(d._id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <PenTool className="mr-2 h-4 w-4" /> Add Fields & Send
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentsPage;
