import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { UploadCloud, FileText, AlertCircle } from "lucide-react";

const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const upload = async () => {
    if (!file) { setError("Please select a PDF file."); return; }
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (title.trim()) fd.append("title", title.trim());
      await api.post("/documents/upload", fd);
      navigate("/documents");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Upload Document</h2>
        <p className="text-slate-500 mt-1">Upload a PDF document to prepare it for signing.</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Document Details</CardTitle>
          <CardDescription>Provide a title and select the PDF file you want to upload.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Document Title (optional)</Label>
            <Input 
              id="title" 
              placeholder="e.g. Employment Agreement" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">PDF File</Label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-300 px-6 py-10 hover:bg-slate-50 transition-colors">
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only" 
                      accept="application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-slate-500">PDF up to 10MB</p>
              </div>
            </div>
            {file && (
              <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-3 rounded-md border border-indigo-100">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{file.name}</span>
                <span className="text-indigo-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4" 
            onClick={upload}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload Document"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPage;
