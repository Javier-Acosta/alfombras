import { PDFDocument, rgb, type PDFPage } from "pdf-lib";
import {
  embedPdfFont,
  wrapPdfText,
  type PdfOrder,
  type PdfIdentity,
} from "./order-pdf.ts";
import { formatMoney } from "./money.ts";
import { salesPeriodLabel, type SalesRange } from "./sales-report.ts";

export async function createSalesReportPdf(
  orders: PdfOrder[],
  identity: PdfIdentity,
  range: SalesRange,
  generated = new Date(),
) {
  const total = orders.reduce((sum, order) => sum + order.totalMinor, 0);
  if (
    !Number.isSafeInteger(total) ||
    orders.some(
      (o) => o.currency !== "ARS" || !Number.isSafeInteger(o.totalMinor),
    )
  )
    throw new Error("Importes inválidos.");
  const doc = await PDFDocument.create();
  const font = await embedPdfFont(doc);
  const ink = rgb(0.063, 0.067, 0.157),
    orange = rgb(0.93, 0.5, 0.14),
    muted = rgb(0.36, 0.38, 0.42),
    pale = rgb(0.97, 0.96, 0.94);
  const width = 595.28,
    height = 841.89,
    margin = 44,
    contentWidth = width - 2 * margin,
    bottom = height - 65;
  const money = (value: number) => formatMoney(value).replace(/\s/g, " ");
  const date = (value: string | Date) =>
    new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(new Date(value));
  doc.setTitle("Ventas confirmadas - Registro interno");
  doc.setAuthor(identity.site_name);
  doc.setCreationDate(generated);
  doc.setSubject(
    "Ventas confirmadas sin archivar. No es factura ni comprobante de pago.",
  );
  let page!: PDFPage;
  let y = 0;
  let continuing: string | undefined;
  function text(value: string, x: number, top: number, size = 10, color = ink) {
    page.drawText(value, { x, y: height - top - size, size, font, color });
  }
  function block(value: string, size = 10, color = ink, indent = 0) {
    for (const line of wrapPdfText(value, font, size, contentWidth - indent)) {
      if (y + size + 5 > bottom) newPage();
      text(line, margin + indent, y, size, color);
      y += size + 5;
    }
  }
  function newPage() {
    page = doc.addPage([width, height]);
    y = 35;
    block(identity.site_name, 15);
    block("VENTAS CONFIRMADAS - REGISTRO INTERNO", 10, orange);
    page.drawLine({
      start: { x: margin, y: height - y - 8 },
      end: { x: width - margin, y: height - y - 8 },
      thickness: 2,
      color: orange,
    });
    y += 22;
    if (continuing) block(`Pedido ${continuing} (continuación)`, 10, muted);
  }
  function ensure(space: number) {
    if (y + space > bottom) newPage();
  }
  newPage();
  block(salesPeriodLabel(range), 13);
  block("Filtro por fecha del pedido (horario de Argentina).", 9, muted);
  block("Incluye únicamente ventas confirmadas sin archivar.", 9, muted);
  block(`Generado el ${date(generated)} (Argentina).`, 9, muted);
  y += 12;
  page.drawRectangle({
    x: margin,
    y: height - y - 54,
    width: contentWidth,
    height: 54,
    color: pale,
  });
  text(`Cantidad de ventas: ${orders.length}`, margin + 12, y + 9, 11);
  text(`Total general ARS: ${money(total)}`, margin + 12, y + 28, 16);
  y += 74;
  orders.forEach((order, index) => {
    const heading = wrapPdfText(
      `${index + 1}. ${order.reference}`,
      font,
      13,
      contentWidth - 20,
    );
    const contact = wrapPdfText(
      `Contacto: ${order.email}`,
      font,
      10,
      contentWidth,
    );
    const bandHeight = heading.length * 18 + 16;
    const itemHeight = order.items.reduce(
      (sum, item) =>
        sum +
        wrapPdfText(
          `${item.name} × ${item.quantity}`,
          font,
          10,
          contentWidth - 10,
        ).length *
          15 +
        19,
      0,
    );
    const orderHeight = bandHeight + contact.length * 15 + itemHeight + 80;
    continuing = undefined;
    // Keep a complete sale together when it fits on one page.
    ensure(
      orderHeight <= bottom - 100
        ? orderHeight
        : bandHeight + contact.length * 15 + 90,
    );
    continuing = order.reference;
    page.drawRectangle({
      x: margin,
      y: height - y - bandHeight,
      width: contentWidth,
      height: bandHeight,
      color: pale,
    });
    heading.forEach((line, i) => text(line, margin + 10, y + 8 + i * 18, 13));
    y += bandHeight + 8;
    block(`Fecha del pedido: ${date(order.created)} (Argentina)`, 9, muted);
    block(`Contacto: ${order.email}`);
    y += 4;
    order.items.forEach((item) => {
      const description = wrapPdfText(
        `${item.name} × ${item.quantity}`,
        font,
        10,
        contentWidth - 10,
      );
      ensure(description.length * 15 + 36);
      description.forEach((line) => {
        if (y + 15 > bottom) newPage();
        text(line, margin + 10, y);
        y += 15;
      });
      block(
        `Precio unitario: ${money(item.unitPriceMinor)} | Subtotal: ${money(item.subtotalMinor)}`,
        9,
        muted,
        10,
      );
      y += 5;
    });
    ensure(42);
    block(`Total de la venta: ${money(order.totalMinor)}`, 12);
    page.drawLine({
      start: { x: margin, y: height - y - 8 },
      end: { x: width - margin, y: height - y - 8 },
      thickness: 0.5,
      color: rgb(0.84, 0.84, 0.84),
    });
    y += 26;
  });
  continuing = undefined;
  ensure(115);
  block(`CANTIDAD TOTAL DE VENTAS: ${orders.length}`, 11);
  block(`TOTAL GENERAL ARS: ${money(total)}`, 17);
  y += 8;
  block("Registro interno. No es factura ni comprobante de pago.", 10);
  block(
    "Una venta confirmada no acredita el cobro. Se conservan los importes originales de cada pedido.",
    9,
    muted,
  );
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: margin, y: 43 },
      end: { x: width - margin, y: 43 },
      thickness: 0.5,
      color: rgb(0.84, 0.84, 0.84),
    });
    p.drawText("Ventas confirmadas - Registro interno", {
      x: margin,
      y: 27,
      size: 8,
      font,
      color: muted,
    });
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
