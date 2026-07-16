/**
 * Limpieza de metadatos de imágenes en el navegador, ANTES de subirlas.
 *
 * El concurso es anónimo hasta la revelación: los archivos no deben delatar a la
 * firma. Las imágenes suelen traer EXIF (autor, GPS, dispositivo, software) o
 * bloques XMP/IPTC. Aquí se eliminan esos segmentos SIN recomprimir la imagen
 * (no se pierde calidad): solo se descartan los trozos de metadatos y se conserva
 * intacto el dato de píxeles.
 *
 * Todo es "fail-open": ante cualquier duda se devuelve el archivo original tal
 * cual. Nunca se debe bloquear ni corromper una subida por intentar limpiarla.
 * Los PDF no se tocan aquí (no se pueden limpiar de forma fiable en el navegador);
 * a las firmas se les pide exportarlos sin datos de autor.
 */

/** JPEG: descarta APP1–APP15 (EXIF/XMP/IPTC/Photoshop) y COM; conserva todo lo demás. */
function stripJpeg(bytes: Uint8Array): Uint8Array {
  const n = bytes.length;
  if (n < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("no es JPEG");
  const out: number[] = [0xff, 0xd8];
  let i = 2;
  while (i + 1 < n) {
    if (bytes[i] !== 0xff) throw new Error("estructura inesperada");
    const code = bytes[i + 1];
    if (code === 0xd9) {
      out.push(0xff, 0xd9); // EOI
      break;
    }
    if (code === 0xda) {
      // SOS: a partir de aquí van los datos comprimidos hasta el final; copiar tal cual.
      for (let k = i; k < n; k++) out.push(bytes[k]);
      break;
    }
    if (i + 3 >= n) throw new Error("truncado");
    const len = (bytes[i + 2] << 8) | bytes[i + 3]; // incluye los 2 bytes de longitud
    const segEnd = i + 2 + len;
    if (len < 2 || segEnd > n) throw new Error("longitud inválida");
    // APP1..APP15 = 0xE1..0xEF; COM = 0xFE. APP0 (0xE0, JFIF) se conserva.
    const drop = (code >= 0xe1 && code <= 0xef) || code === 0xfe;
    if (!drop) for (let k = i; k < segEnd; k++) out.push(bytes[k]);
    i = segEnd;
  }
  return new Uint8Array(out);
}

/** PNG: descarta los chunks de texto/metadatos; conserva imagen y chunks técnicos. */
function stripPng(bytes: Uint8Array): Uint8Array {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const n = bytes.length;
  if (n < 8) throw new Error("no es PNG");
  for (let k = 0; k < 8; k++) if (bytes[k] !== sig[k]) throw new Error("no es PNG");
  const out: number[] = [...sig];
  const drop = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME", "dSIG"]);
  const latin1 = new TextDecoder("latin1");
  let i = 8;
  while (i + 8 <= n) {
    const len = ((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0;
    const type = latin1.decode(bytes.subarray(i + 4, i + 8));
    const end = i + 12 + len; // 4 (len) + 4 (tipo) + len (datos) + 4 (CRC)
    if (end > n) throw new Error("truncado");
    if (!drop.has(type)) for (let k = i; k < end; k++) out.push(bytes[k]);
    i = end;
    if (type === "IEND") break;
  }
  return new Uint8Array(out);
}

/**
 * Devuelve una copia del archivo sin metadatos si es una imagen soportada; en
 * cualquier otro caso (u otro formato, o cualquier error) devuelve el original.
 */
export async function stripImageMetadata(file: File): Promise<File> {
  try {
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const buf = new Uint8Array(await file.arrayBuffer());
    let out: Uint8Array | null = null;
    if (ext === "jpg" || ext === "jpeg") out = stripJpeg(buf);
    else if (ext === "png") out = stripPng(buf);

    // Limpiar solo puede reducir el tamaño (o dejarlo igual). Si algo no cuadra,
    // se conserva el original para no arriesgar la integridad del archivo.
    if (!out || out.length === 0 || out.length > buf.length) return file;
    // `out` es un Uint8Array recién creado (offset 0), así que su buffer es
    // exactamente los bytes limpios. El cast evita el choque de tipos entre
    // ArrayBufferLike y ArrayBuffer en el constructor de File.
    return new File([out.buffer as ArrayBuffer], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}
