/** Constantes y helpers compartidos para la subida de archivos de propuestas. */

export const BUCKET = "seleccion-nauno-files";

/** Límite por archivo. Supabase Storage lo permite; Vercel NO se usa para los bytes. */
export const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Reglas de entrega por sección: qué formatos acepta y cuántos archivos admite.
 * Cada sección pide algo distinto, así que el formato y el máximo se definen aquí
 * y los usan tanto el formulario como la ruta que firma la subida.
 * Se valida por extensión porque el content-type lo pone el cliente.
 */
export const KIND_RULES = {
  concepto: { extensions: ["pdf", "png"], max: 1 },
  masterplan: { extensions: ["pdf"], max: 1 },
  volumetria: { extensions: ["pdf", "png", "jpg", "jpeg"], max: 1 },
  organizacion: { extensions: ["pdf", "png", "jpg", "jpeg"], max: 1 },
  proyecto: { extensions: ["pdf", "png", "jpg", "jpeg"], max: 2 },
} as const;

export type UploadKind = keyof typeof KIND_RULES;

export const ALLOWED_KINDS = Object.keys(KIND_RULES) as UploadKind[];

export function isUploadKind(value: string): value is UploadKind {
  return Object.hasOwn(KIND_RULES, value);
}

/** Formatos de una sección, listos para el atributo accept del input. */
export function acceptAttr(kind: UploadKind): string {
  return KIND_RULES[kind].extensions.map((e) => `.${e}`).join(",");
}

/** Formatos de una sección en texto legible: "PDF o PNG". */
export function formatsLabel(kind: UploadKind): string {
  const names = [...new Set(KIND_RULES[kind].extensions.map((e) => (e === "jpeg" ? "jpg" : e)))].map(
    (e) => e.toUpperCase()
  );
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} o ${names[names.length - 1]}`;
}

export function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

/** Ruta dentro del bucket, siempre bajo la carpeta de la propuesta. */
export function safeStoragePath(proposalId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${proposalId}/${crypto.randomUUID()}-${safeName}`;
}
