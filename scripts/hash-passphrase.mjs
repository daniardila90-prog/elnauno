// Genera el valor de IDENTITY_REVEAL_PASSPHRASE_HASH a partir de una passphrase.
// La passphrase en claro nunca se guarda: solo la custodia el organizador.
//
// Uso:
//   node scripts/hash-passphrase.mjs 'la-clave-que-elijas'
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const passphrase = process.argv[2];

if (!passphrase) {
  console.error("Uso: node scripts/hash-passphrase.mjs 'la-clave-que-elijas'");
  process.exit(1);
}
if (passphrase.length < 12) {
  console.error("Use una clave de al menos 12 caracteres.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = await scryptAsync(passphrase.normalize("NFKC"), salt, 32);

console.log("\nAgregue esta variable en Vercel y en .env.local:\n");
console.log(`IDENTITY_REVEAL_PASSPHRASE_HASH=scrypt$${salt.toString("hex")}$${hash.toString("hex")}`);
console.log("\nLa clave en claro no queda en ningún lado: guárdela usted.\n");
