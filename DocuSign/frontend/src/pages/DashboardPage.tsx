import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAppSelector } from "../store/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { FileText, Plus, FileSignature, CheckCircle, Clock, File } from "lucide-react";
import { copyToClipboard } from "../lib/clipboard";
import { buildSigningLink, getStatusBadge, getEnvelopeForDoc, getEnvelopesForDoc, EnvelopeRef } from "../lib/helpers";
import { notifyApiError } from "../lib/notify";

interface RecentDoc { _id: string; title: string; status: string; createdAt: string }

const DashboardPage: React.FC = () => {
  const user = useAppSelector((s) => s.user.user);
  const navigate = useNavigate();
  const [docs, setDocs] = useState<RecentDoc[]>([]);
  const [envelopes, setEnvelopes] = useState<EnvelopeRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [docsResp, envResp] = await Promise.all([
          api.get("/documents"),
          api.get("/sign/envelopes"),
        ]);
        setDocs(docsResp.data || []);
        setEnvelopes(envResp.data || []);
      } catch (err) {
        notifyApiError(err, "Failed to load dashboard data");
      }
      finally { setLoading(false); }
    })();
  }, []);

  const getEnvelope = (docId: string) => getEnvelopeForDoc(envelopes, docId);

  const total = docs.length;
  const draft = docs.filter((d) => d.status === "draft").length;
  const sent  = docs.filter((d) => d.status === "sent" || d.status === "partially_signed").length;
  const signed = docs.filter((d) => d.status === "signed").length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back, {user?.first_name || user?.full_name || user?.name || "User"} 👋
        </h2>
        <p className="text-slate-500 mt-2">
          Here's an overview of your documents and signing activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-indigo-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{total}</div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-slate-400 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Drafts</CardTitle>
            <File className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{draft}</div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Signatures</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{sent}</div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{signed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link to="/upload">
            <Plus className="mr-2 h-4 w-4" /> Upload Document
          </Link>
        </Button>
        <Button asChild variant="outline" className="bg-white">
          <Link to="/documents">
            <FileSignature className="mr-2 h-4 w-4" /> All Documents
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading documents...</div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No documents yet</h3>
              <p className="text-slate-500 mb-4">Get started by uploading your first PDF.</p>
              <Button asChild variant="outline">
                <Link to="/upload">Upload Document</Link>
              </Button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.slice(0, 5).map((d) => {
                  const env = getEnvelope(d._id);
                  const allEnvs = getEnvelopesForDoc(envelopes, d._id);
                  const isBothMode = allEnvs.length > 1 || allEnvs.some(e => (e as any).signMode === "both");
                  return (
                    <TableRow key={d._id}>
                      <TableCell className="font-medium">
                        <div>{d.title}</div>
                        {isBothMode ? (
                          allEnvs.map(e => (
                            <div key={e._id} className="text-xs text-slate-500 mt-1">
                              {e.signerEmail} {e.status === "signed" ? "✓" : "(pending)"}
                            </div>
                          ))
                        ) : env && <div className="text-xs text-slate-500 mt-1">Signer: {env.signerEmail}</div>}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(d.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {d.status === "draft" && (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="bg-indigo-600 hover:bg-indigo-700 h-8"
                              onClick={() => navigate(`/field-editor?documentId=${d._id}`)}
                            >
                              Setup
                            </Button>
                          )}
                          {env && d.status !== "signed" && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                              onClick={() => copyToClipboard(buildSigningLink(env.signingToken), "Signing link")}
                            >
                              Share Link
                            </Button>
                          )}
                          {d.status === "signed" && env && (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="bg-emerald-600 hover:bg-emerald-700 h-8"
                              onClick={() => navigate(`/sign/${env.signingToken}`)}
                            >
                              Download
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
