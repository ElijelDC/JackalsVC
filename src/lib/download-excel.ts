/** Trigger a browser download for an Excel API response. */
export async function downloadExcelFromUrl(
  exportUrl: string,
  fallbackFilename: string,
) {
  const response = await fetch(exportUrl, { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error("Export failed");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? fallbackFilename;
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
