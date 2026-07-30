"use client";

import { buildCsvDownload } from "../lib/indicator-download";

export function DownloadCsvButton({ rawCsv }: { rawCsv: string }) {
  function download() {
    const descriptor = buildCsvDownload(rawCsv);
    const url = URL.createObjectURL(
      new Blob([descriptor.content], { type: descriptor.mimeType }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = descriptor.fileName;

    try {
      anchor.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return (
    <button type="button" className="download-button" onClick={download}>
      CSV 내려받기
    </button>
  );
}
