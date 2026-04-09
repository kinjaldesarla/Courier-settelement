import { useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import Card from "../components/Card.jsx";

export default function UploadPanel({ file, setFile, batchId, setBatchId, onUpload, uploading }) {
  const accept = useMemo(
    () => ({
      "text/csv": [".csv"],
      "application/json": [".json"]
    }),
    []
  );

  const dropzone = useDropzone({
    multiple: false,
    accept,
    onDrop: (accepted) => setFile(accepted?.[0] ?? null)
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Upload settlement batch</h3>
          <p className="mt-1 text-sm text-slate-500">CSV or JSON only. Maximum 1000 rows per upload.</p>
        </div>
        <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Max 1000 rows
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div
          {...dropzone.getRootProps()}
          className={[
            "flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-6 text-center transition",
            dropzone.isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50 hover:border-indigo-400"
          ].join(" ")}
        >
          <input {...dropzone.getInputProps()} />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <UploadCloud className="h-7 w-7 text-indigo-600" />
          </div>
          <div className="mt-4 text-base font-semibold text-slate-900">Drag & drop or click to upload</div>
          <div className="mt-2 text-sm text-slate-500">Supports settlement feeds in CSV and JSON format.</div>
          {file ? <div className="mt-4 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">{file.name}</div> : null}
        </div>

        <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Batch ID</label>
            <input
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
              placeholder="Optional batch identifier"
              className="mt-2 w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm"
            />
          </div>
          <div className="text-xs leading-5 text-slate-500">
            Keep batch ID empty to let the API deduplicate by payload hash.
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setBatchId("");
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              Reset
            </button>
            <button
              type="button"
              disabled={!file || uploading}
              onClick={onUpload}
              className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload file"}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
