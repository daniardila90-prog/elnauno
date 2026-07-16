import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Proposal, ProposalFile } from "@/lib/supabase/types";

export type PdfFile = Pick<ProposalFile, "kind" | "file_name"> & { url: string | null };

const PAGE = { width: 595.28, height: 841.89 }; // A4
const MARGIN = 56;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

const INK = rgb(0.13, 0.18, 0.14);
const MUTED = rgb(0.45, 0.48, 0.45);
const RULE = rgb(0.83, 0.81, 0.77);

/**
 * Las fuentes estándar de PDF usan WinAnsi, que no cubre todo lo que puede venir
 * de un textarea (comillas tipográficas, viñetas, emojis). Cualquier carácter
 * fuera del juego revienta al escribir, así que se sustituye antes.
 */
function toWinAnsi(text: string): string {
  return text
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[•·]/g, "-")
    .replace(/ /g, " ")
    .replace(/[^\x20-\x7E\xA1-\xFF]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of toWinAnsi(text).split(/\r?\n/)) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** Escritor secuencial que salta de página solo cuando se acaba el espacio. */
class Writer {
  private doc: PDFDocument;
  private regular: PDFFont;
  private bold: PDFFont;
  private page: PDFPage;
  private y: number;

  constructor(doc: PDFDocument, regular: PDFFont, bold: PDFFont) {
    this.doc = doc;
    this.regular = regular;
    this.bold = bold;
    this.page = doc.addPage([PAGE.width, PAGE.height]);
    this.y = PAGE.height - MARGIN;
  }

  private ensure(space: number) {
    if (this.y - space < MARGIN) {
      this.page = this.doc.addPage([PAGE.width, PAGE.height]);
      this.y = PAGE.height - MARGIN;
    }
  }

  gap(space: number) {
    this.y -= space;
  }

  text(content: string, opts: { size?: number; bold?: boolean; color?: typeof INK } = {}) {
    const size = opts.size ?? 10;
    const font = opts.bold ? this.bold : this.regular;
    const leading = size * 1.45;
    for (const line of wrap(content, font, size, CONTENT_WIDTH)) {
      this.ensure(leading);
      if (line !== "") {
        this.page.drawText(line, {
          x: MARGIN,
          y: this.y - size,
          size,
          font,
          color: opts.color ?? INK,
        });
      }
      this.y -= leading;
    }
  }

  sectionTitle(title: string) {
    this.ensure(40);
    this.gap(14);
    this.text(title.toUpperCase(), { size: 9, bold: true, color: MUTED });
    this.gap(2);
    this.ensure(8);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE.width - MARGIN, y: this.y },
      thickness: 0.75,
      color: RULE,
    });
    this.gap(10);
  }

  field(label: string, value: string | null | undefined) {
    this.text(label, { size: 8, bold: true, color: MUTED });
    this.gap(1);
    this.text(value?.trim() ? value : "—", { size: 10 });
    this.gap(8);
  }
}

function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

const KIND_LABEL: Record<string, string> = {
  concepto: "Imagen conceptual / moodboard",
  masterplan: "Plano de implantación (Masterplan)",
  volumetria: "Imagen de la estrategia volumétrica",
  organizacion: "Imagen de la organización funcional",
  proyecto: "Imagen del proyecto",
};

/** Incrusta un adjunto: las imágenes ocupan una página, los PDF se anexan tal cual. */
async function appendAttachment(
  doc: PDFDocument,
  file: PdfFile,
  bytes: ArrayBuffer,
  font: PDFFont
): Promise<void> {
  const ext = extensionOf(file.file_name);

  if (ext === "pdf") {
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await doc.copyPages(src, src.getPageIndices());
    for (const p of pages) doc.addPage(p);
    return;
  }

  const image =
    ext === "png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

  const page = doc.addPage([PAGE.width, PAGE.height]);
  const caption = `${KIND_LABEL[file.kind] ?? file.kind} · ${toWinAnsi(file.file_name)}`;
  page.drawText(caption.slice(0, 110), {
    x: MARGIN,
    y: PAGE.height - MARGIN + 8,
    size: 8,
    font,
    color: MUTED,
  });

  const maxW = CONTENT_WIDTH;
  const maxH = PAGE.height - MARGIN * 2;
  const scale = Math.min(maxW / image.width, maxH / image.height, 1);
  const w = image.width * scale;
  const h = image.height * scale;
  page.drawImage(image, {
    x: (PAGE.width - w) / 2,
    y: (PAGE.height - h) / 2,
    width: w,
    height: h,
  });
}

export type IdentityForPdf = {
  firm_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
} | null;

/**
 * Arma el dossier de una propuesta: respuestas + adjuntos incrustados.
 * La identidad solo se incluye si ya fue revelada; mientras el proceso sea
 * anónimo el PDF no debe poder delatar a la firma.
 */
export async function buildProposalPdf({
  proposal,
  files,
  identity,
}: {
  proposal: Proposal;
  files: PdfFile[];
  identity: IdentityForPdf;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  doc.setTitle(`${proposal.proposal_code} — Selección arquitectónica El Nauno`);
  doc.setProducer("El Nauno");
  doc.setCreator("El Nauno");

  const w = new Writer(doc, regular, bold);

  w.text("Selección arquitectónica · Hotel El Nauno", { size: 9, color: MUTED });
  w.gap(6);
  w.text(proposal.proposal_code, { size: 24, bold: true });
  w.gap(4);
  const estado = proposal.status === "submitted" ? "Enviada" : "Borrador";
  const fecha = proposal.submitted_at
    ? new Date(proposal.submitted_at).toLocaleString("es-CO")
    : null;
  w.text(fecha ? `${estado} · ${fecha}` : estado, { size: 9, color: MUTED });
  w.gap(10);

  w.sectionTitle("Concepto de diseño");
  w.field("Concepto (una frase)", proposal.concepto_frase);
  w.field("Desarrollo del concepto", proposal.concepto_desarrollo);

  w.sectionTitle("Análisis de sitio y emplazamiento");
  w.field("Oportunidades del sitio", proposal.sitio_oportunidades);

  w.sectionTitle("Volumetría");
  w.field("Estrategia volumétrica", proposal.volumetria_estrategia);
  w.field("Organización funcional y circulaciones", proposal.volumetria_organizacion);

  w.sectionTitle("Materialidad y fachada");
  w.field("Material principal", proposal.fachada_material_principal);
  w.field("Material secundario", proposal.fachada_material_secundario);
  w.field("Acabado / textura", proposal.fachada_acabado);
  w.field("Carpintería / vidrio", proposal.fachada_carpinteria);
  w.field("Estrategia de materiales", proposal.fachada_estrategia);
  w.field("Intención de la fachada", proposal.fachada_intencion);

  w.sectionTitle("Fases de diseño");
  const fases = proposal.fases_json ?? {};
  const fasesLabels: [string, keyof typeof fases][] = [
    ["Anteproyecto", "anteproyecto_semanas"],
    ["Proyecto arquitectónico", "proyecto_semanas"],
    ["Coordinación técnica", "coordinacion_semanas"],
    ["Documentos de construcción", "documentos_semanas"],
  ];
  for (const [label, key] of fasesLabels) {
    const v = fases[key];
    w.field(label, v != null ? `${v} semanas` : null);
  }
  w.field("Metodología de trabajo", proposal.enfoque_trabajo);

  if (identity) {
    w.sectionTitle("Identidad (revelada)");
    w.field("Firma", identity.firm_name);
    w.field("Contacto", identity.contact_name);
    w.field("Correo", identity.email);
    w.field("Teléfono", identity.phone);
  }

  w.sectionTitle("Archivos adjuntos");
  if (files.length === 0) {
    w.text("Sin archivos adjuntos.", { size: 10, color: MUTED });
  } else {
    for (const f of files) {
      w.text(`- ${KIND_LABEL[f.kind] ?? f.kind}: ${f.file_name}`, { size: 9 });
    }
  }

  // Los adjuntos se descargan directo de Storage (no pasan por el servidor).
  // Si uno falla, el dossier se entrega igual con una nota en su lugar.
  for (const file of files) {
    if (!file.url) continue;
    const ext = extensionOf(file.file_name);
    const embeddable = ["pdf", "png", "jpg", "jpeg"].includes(ext);
    if (!embeddable) continue;
    try {
      const res = await fetch(file.url);
      if (!res.ok) throw new Error(String(res.status));
      await appendAttachment(doc, file, await res.arrayBuffer(), regular);
    } catch {
      const page = doc.addPage([PAGE.width, PAGE.height]);
      page.drawText(toWinAnsi(`No se pudo incrustar: ${file.file_name}`), {
        x: MARGIN,
        y: PAGE.height / 2,
        size: 10,
        font: regular,
        color: MUTED,
      });
    }
  }

  return doc.save();
}
