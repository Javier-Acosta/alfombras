import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatMoney } from "./money.ts";
import { isOrderStatus, orderStatuses } from "./order-status.ts";
import type { OrderLine } from "./order-core.ts";

export type PdfOrder = {
  reference: string;
  created: string;
  email: string;
  status: string;
  archived: boolean;
  items: OrderLine[];
  totalMinor: number;
  currency: string;
};
export type PdfIdentity = {
  site_name: string;
  address: string;
  whatsapp: string;
};
let fontBytes: ReturnType<typeof readFile> | undefined;
const ink = rgb(0.063, 0.067, 0.157);
const muted = rgb(0.36, 0.38, 0.42);
const orange = rgb(0.93, 0.5, 0.14);
const pale = rgb(0.97, 0.96, 0.94);
const date = (value: string | Date) =>
  new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));

// Also split unbroken text so a long product name or email cannot leave the page.
export function wrapPdfText(
  text: string,
  font: PDFFont,
  size: number,
  width: number,
): string[] {
  const charset = new Set(font.getCharacterSet());
  const clean = Array.from(
    text
      .normalize("NFC")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/[\u2010-\u2015]/g, "-"),
  )
    .map((char) => (charset.has(char.codePointAt(0)!) ? char : "?"))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  const result: string[] = [];
  let current = "";
  for (const word of clean.split(" ")) {
    if (
      current &&
      font.widthOfTextAtSize(`${current} ${word}`, size) <= width
    ) {
      current += ` ${word}`;
      continue;
    }
    if (current) {
      result.push(current);
      current = "";
    }
    for (const char of word) {
      if (current && font.widthOfTextAtSize(current + char, size) > width) {
        result.push(current);
        current = "";
      }
      current += char;
    }
  }
  if (current || !result.length) result.push(current);
  return result;
}
const lines = wrapPdfText;

export async function embedPdfFont(doc: PDFDocument) {
  doc.registerFontkit(fontkit);
  fontBytes ??= readFile(
    path.join(process.cwd(), "public/fonts/lato-regular.ttf"),
  );
  return doc.embedFont(await fontBytes, { subset: true });
}

export async function createOrderPdf(
  order: PdfOrder,
  identity: PdfIdentity,
  generated = new Date(),
) {
  const doc = await PDFDocument.create();
  const font = await embedPdfFont(doc);
  doc.setTitle(`Registro interno - Pedido ${order.reference}`);
  doc.setAuthor(identity.site_name);
  doc.setSubject(
    "Registro interno de pedido. No es factura ni comprobante de pago.",
  );
  doc.setCreationDate(generated);
  const width = 595.28,
    height = 841.89,
    margin = 44,
    contentWidth = width - margin * 2;
  let page: PDFPage;
  let y = 0;
  function text(value: string, x: number, top: number, size = 10, color = ink) {
    page.drawText(value, { x, y: height - top - size, size, font, color });
  }
  function block(
    value: string,
    size = 10,
    color = ink,
    maxWidth = contentWidth,
  ) {
    for (const line of lines(value, font, size, maxWidth)) {
      if (y + size + 5 > height - 66) newPage();
      text(line, margin, y, size, color);
      y += size + 5;
    }
  }
  function newPage() {
    page = doc.addPage([width, height]);
    y = 38;
    block(identity.site_name, 16);
    page.drawLine({
      start: { x: margin, y: height - y - 10 },
      end: { x: width - margin, y: height - y - 10 },
      thickness: 2,
      color: orange,
    });
    y += 27;
  }
  function tableHeader() {
    page.drawRectangle({
      x: margin,
      y: height - y - 27,
      width: contentWidth,
      height: 27,
      color: ink,
    });
    text("PRODUCTO", margin + 10, y + 8, 9, rgb(1, 1, 1));
    text("CANT.", 318, y + 8, 9, rgb(1, 1, 1));
    text("PRECIO UNIT.", 365, y + 8, 9, rgb(1, 1, 1));
    text("SUBTOTAL", 470, y + 8, 9, rgb(1, 1, 1));
    y += 27;
  }
  function right(value: string, edge: number, top: number, size = 9) {
    text(value, edge - font.widthOfTextAtSize(value, size), top, size);
  }
  newPage();
  block("REGISTRO INTERNO DE PEDIDO", 10, orange);
  y += 7;
  block(`Referencia: ${order.reference}`, 16);
  y += 5;
  block(`Fecha del pedido: ${date(order.created)} (Argentina)`, 10, muted);
  block(
    `Estado: ${isOrderStatus(order.status) ? orderStatuses[order.status] : "Sin especificar"}${order.archived ? " - Archivado" : ""}`,
  );
  block(`Contacto del cliente: ${order.email}`);
  block(`Moneda: ${order.currency}`);
  y += 15;
  tableHeader();
  order.items.forEach((item, index) => {
    const wrapped = lines(item.name, font, 10, 253);
    const fullRowHeight = wrapped.length * 15 + 18;
    // Keep a normal product row together; only oversized rows need splitting.
    if (y + fullRowHeight > height - 66 && fullRowHeight <= height - 190) {
      newPage();
      tableHeader();
    }
    let offset = 0;
    while (offset < wrapped.length) {
      if (y + 33 > height - 66) {
        newPage();
        tableHeader();
      }
      const count = Math.min(
        wrapped.length - offset,
        Math.max(1, Math.floor((height - 66 - y - 18) / 15)),
      );
      const rowHeight = count * 15 + 18;
      if (index % 2 === 0)
        page.drawRectangle({
          x: margin,
          y: height - y - rowHeight,
          width: contentWidth,
          height: rowHeight,
          color: pale,
        });
      for (let j = 0; j < count; j++)
        text(wrapped[offset + j], margin + 10, y + 9 + j * 15);
      if (offset === 0) {
        right(String(item.quantity), 346, y + 10);
        right(
          formatMoney(item.unitPriceMinor).replace(/\s/g, " "),
          449,
          y + 10,
          8.5,
        );
        right(
          formatMoney(item.subtotalMinor).replace(/\s/g, " "),
          width - margin - 10,
          y + 10,
          8.5,
        );
      }
      page.drawLine({
        start: { x: margin, y: height - y - rowHeight },
        end: { x: width - margin, y: height - y - rowHeight },
        thickness: 0.5,
        color: rgb(0.84, 0.84, 0.84),
      });
      y += rowHeight;
      offset += count;
    }
  });
  if (y + 140 > height - 66) newPage();
  y += 18;
  text(`TOTAL ${order.currency}`, margin, y, 12);
  right(
    formatMoney(order.totalMinor).replace(/\s/g, " "),
    width - margin,
    y,
    18,
  );
  y += 44;
  block("Registro interno. No es factura ni comprobante de pago.", 10);
  block(
    "El estado del pedido no acredita un cobro. Los importes corresponden al pedido original.",
    9,
    muted,
  );
  y += 10;
  if (identity.address) block(identity.address, 9, muted);
  if (identity.whatsapp)
    block(`WhatsApp de la fábrica: +${identity.whatsapp}`, 9, muted);
  block(`Generado el ${date(generated)} (Argentina).`, 8, muted);
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: margin, y: 43 },
      end: { x: width - margin, y: 43 },
      thickness: 0.5,
      color: rgb(0.84, 0.84, 0.84),
    });
    p.drawText(
      lines(
        `Registro interno - ${order.reference}`,
        font,
        8,
        contentWidth - 100,
      )[0],
      {
        x: margin,
        y: 27,
        size: 8,
        font,
        color: muted,
      },
    );
    const number = `Página ${i + 1} de ${pages.length}`;
    p.drawText(number, {
      x: width - margin - font.widthOfTextAtSize(number, 8),
      y: 27,
      size: 8,
      font,
      color: muted,
    });
  });
  return doc.save();
}
