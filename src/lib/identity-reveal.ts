import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

/** Colombia no tiene horario de verano: el desfase es fijo. */
const BOGOTA_OFFSET = "-05:00";
const DEFAULT_AVAILABLE_FROM = "2026-07-28";

/**
 * Desde cuándo se puede revelar la identidad. Se define como fecha civil en
 * Colombia y se ancla a UTC-5 para que no dependa del reloj del servidor.
 */
export function revealAvailableFrom(): Date {
  const raw = process.env.IDENTITY_REVEAL_AVAILABLE_FROM?.trim() || DEFAULT_AVAILABLE_FROM;
  const date = new Date(`${raw}T00:00:00${BOGOTA_OFFSET}`);
  if (Number.isNaN(date.getTime())) {
    // Una fecha mal escrita no debe abrir la puerta antes de tiempo.
    return new Date(`${DEFAULT_AVAILABLE_FROM}T00:00:00${BOGOTA_OFFSET}`);
  }
  return date;
}

export function revealIsOpen(now: Date = new Date()): boolean {
  return now.getTime() >= revealAvailableFrom().getTime();
}

export function revealAvailableFromLabel(): string {
  return revealAvailableFrom().toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  });
}

/** Formato almacenado: scrypt$<salt_hex>$<hash_hex>. */
export async function hashPassphrase(passphrase: string, saltHex?: string): Promise<string> {
  const salt = saltHex ? Buffer.from(saltHex, "hex") : randomBytes(16);
  const hash = (await scryptAsync(passphrase.normalize("NFKC"), salt, 32)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function passphraseIsConfigured(): boolean {
  return Boolean(process.env.IDENTITY_REVEAL_PASSPHRASE_HASH?.trim());
}

/**
 * Compara contra el hash guardado en el entorno. Se usa scrypt (lento a
 * propósito) y comparación en tiempo constante: si el hash se filtrara, seguir
 * siendo caro de romper, y aquí no se filtra por diferencias de tiempo.
 */
export async function passphraseMatches(candidate: string): Promise<boolean> {
  const stored = process.env.IDENTITY_REVEAL_PASSPHRASE_HASH?.trim();
  if (!stored) return false;

  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, saltHex, expectedHex] = parts;

  let expected: Buffer;
  try {
    expected = Buffer.from(expectedHex, "hex");
  } catch {
    return false;
  }

  const actual = (await scryptAsync(
    candidate.normalize("NFKC"),
    Buffer.from(saltHex, "hex"),
    expected.length
  )) as Buffer;

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
