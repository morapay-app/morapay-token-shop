/** Draws a receipt as a PNG in the browser (no dependencies, no server round trip). */
export type ReceiptRow = { label: string; value: string };

export async function receiptPng(input: {
  shop: string;
  title: string;
  headline: string;
  rows: ReceiptRow[];
}): Promise<Blob | null> {
  const W = 1080;
  const PAD = 72;
  const ROW = 104;
  const H = 470 + input.rows.length * ROW;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d");
  if (!c) return null;

  c.fillStyle = "#02191a";
  c.fillRect(0, 0, W, H);
  c.textBaseline = "top";
  c.fillStyle = "#6fa89a";
  c.font = "500 34px system-ui, sans-serif";
  c.fillText(input.shop, PAD, 72);
  c.fillStyle = "#4cdb9c";
  c.font = "700 44px system-ui, sans-serif";
  c.fillText(input.title, PAD, 140);
  c.fillStyle = "#eafbf3";
  let size = 84;
  do {
    c.font = `800 ${size}px system-ui, sans-serif`;
    size -= 4;
  } while (c.measureText(input.headline).width > W - PAD * 2 && size > 36);
  c.fillText(input.headline, PAD, 214);

  let y = 350;
  for (const row of input.rows) {
    c.fillStyle = "#12403f";
    c.fillRect(PAD, y, W - PAD * 2, 2);
    c.fillStyle = "#6fa89a";
    c.font = "500 30px system-ui, sans-serif";
    c.fillText(row.label, PAD, y + 34);
    c.fillStyle = "#eafbf3";
    let rs = 32;
    do {
      c.font = `500 ${rs}px ui-monospace, monospace`;
      rs -= 2;
    } while (c.measureText(row.value).width > W - PAD * 2 - 240 && rs > 14);
    c.textAlign = "right";
    c.fillText(row.value, W - PAD, y + 36);
    c.textAlign = "left";
    y += ROW;
  }
  c.fillStyle = "#6fa89a";
  c.font = "500 28px system-ui, sans-serif";
  c.fillText("Powered by Morapay", PAD, H - 76);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
