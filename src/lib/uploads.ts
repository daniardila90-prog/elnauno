/** Constantes y helpers compartidos para la subida de archivos de propuestas. */

export const BUCKET = "seleccion-nauno-files";

export const ALLOWED_KINDS = ["concepto", "masterplan", "volumetria", "proyecto"];

/** Límite por archivo. Supabase Storage lo permite; Vercel NO se usa para los bytes. */
export const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Solo formatos de entrega esperados (planos, imágenes, PDF, CAD, comprimidos).
 * Se valida por extensión porque el content-type lo pone el cliente.
 */
export const ALLOWED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "tif",
  "tiff",
  "dwg",
  "dxf",
  "zip",
  "rar",
  "7z",
];

export function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

/** Ruta dentro del bucket, siempre bajo la carpeta de la propuesta. */
export function safeStoragePath(proposalId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${proposalId}/${crypto.randomUUID()}-${safeName}`;
}

/** Texto de ayuda para el usuario. */
export const ACCEPT_ATTR =
  ".pdf,.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff,.dwg,.dxf,.zip,.rar,.7z";
