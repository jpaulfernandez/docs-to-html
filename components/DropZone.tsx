"use client";

import { useCallback, useRef, useState } from "react";
import { useUploadStore, UploadedFile } from "@/lib/store";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: "docx" | "csv" }) {
  if (type === "docx") {
    return (
      <svg className="w-5 h-5 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-move" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h7.5" />
    </svg>
  );
}

function FileRow({ entry, onRemove }: { entry: UploadedFile; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-ash gap-3 group">
      <div className="flex items-center gap-2 min-w-0">
        <FileIcon type={entry.type} />
        <span className="text-sm font-sans text-navy truncate">{entry.file.name}</span>
        <span className="text-xs text-system-gray shrink-0">({formatBytes(entry.file.size)})</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-system-gray hover:text-orange-courage hover:bg-ash transition-colors"
        aria-label={`Remove ${entry.file.name}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

export default function DropZone() {
  const { files, addFiles, removeFile } = useUploadStore();
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (incoming: File[]) => {
      const { errors: newErrors } = addFiles(incoming);
      setErrors(newErrors);
    },
    [addFiles]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the drop zone itself (not a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    processFiles(dropped);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    processFiles(selected);
    // Reset input so the same file can be re-selected after removal
    e.target.value = "";
  };

  const hasDocx = files.some((f) => f.type === "docx");

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files — click or drag and drop"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={[
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors select-none",
          isDragging
            ? "border-orange-courage bg-orange-courage/5"
            : "border-ash bg-white hover:border-orange-courage/50 hover:bg-ghost/50",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".docx,.csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv"
          className="sr-only"
          onChange={onInputChange}
        />

        {/* Upload icon */}
        <div className={[
          "flex items-center justify-center w-12 h-12 rounded-full transition-colors",
          isDragging ? "bg-orange-courage/10" : "bg-ash",
        ].join(" ")}>
          <svg
            className={["w-6 h-6 transition-colors", isDragging ? "text-orange-courage" : "text-midblue"].join(" ")}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-sm font-sans font-medium text-navy">
            {isDragging ? "Drop files here" : "Drop your .docx + any .csv files here"}
          </p>
          <p className="text-xs text-system-gray mt-0.5">or click to browse</p>
        </div>

        <div className="flex gap-2 text-xs text-system-gray">
          <span className="px-2 py-0.5 bg-ash rounded-full">.docx required · max 20 MB</span>
          <span className="px-2 py-0.5 bg-ash rounded-full">.csv optional · max 10 MB each</span>
        </div>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
            >
              <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>{err}</span>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setErrors([])}
            className="text-xs text-system-gray underline underline-offset-2 hover:text-navy"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {/* Docx first */}
          {files
            .filter((f) => f.type === "docx")
            .map((entry) => (
              <FileRow
                key={entry.id}
                entry={entry}
                onRemove={() => removeFile(entry.id)}
              />
            ))}
          {/* Then CSVs */}
          {files
            .filter((f) => f.type === "csv")
            .map((entry) => (
              <FileRow
                key={entry.id}
                entry={entry}
                onRemove={() => removeFile(entry.id)}
              />
            ))}
        </div>
      )}

      {/* Hint when docx is missing */}
      {!hasDocx && files.length > 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Add a .docx file to continue.
        </p>
      )}
    </div>
  );
}
