// Genera el valor de IDENTITY_REVEAL_PASSPHRASE_HASH a partir de una passphrase.
// La passphrase en claro nunca se guarda ni se imprime: solo la custodia el
// organizador. Se pide por teclado (oculta) para que no quede en el historial
// de la terminal.
//
// Uso:
//   node scripts/hash-passphrase.mjs
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const ENTER = 13;
const NEWLINE = 10;
const CTRL_C = 3;
const CTRL_D = 4;
const BACKSPACE = 127;
const BACKSPACE_ALT = 8;

/** Lee del teclado sin mostrar lo escrito. */
function askHidden(prompt) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      console.error("Ejecute este script en una terminal interactiva.");
      process.exit(1);
    }
    process.stdout.write(prompt);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const finish = (result) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      process.stdout.write("\n");
      resolve(result);
    };

    const onData = (chunk) => {
      for (const ch of chunk) {
        const code = ch.charCodeAt(0);
        if (code === ENTER || code === NEWLINE || code === CTRL_D) return finish(value);
        if (code === CTRL_C) {
          stdin.setRawMode(false);
          process.stdout.write("\n");
          process.exit(1);
        }
        if (code === BACKSPACE || code === BACKSPACE_ALT) {
          value = value.slice(0, -1);
        } else if (code >= 32) {
          value += ch;
        }
      }
    };
    stdin.on("data", onData);
  });
}

const passphrase = await askHidden("Escriba la clave de revelación (no se verá en pantalla): ");

if (passphrase.length < 12) {
  console.error("\nUse una clave de al menos 12 caracteres.");
  process.exit(1);
}

const repeat = await askHidden("Repítala para confirmar: ");
if (repeat !== passphrase) {
  console.error("\nLas claves no coinciden. Vuelva a intentarlo.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = await scryptAsync(passphrase.normalize("NFKC"), salt, 32);

console.log("\n--- Copie esta línea completa en Vercel ---\n");
console.log(`IDENTITY_REVEAL_PASSPHRASE_HASH=scrypt$${salt.toString("hex")}$${hash.toString("hex")}`);
console.log("\nLa clave en claro no quedó guardada en ningún lado: memorícela o");
console.log("guárdela en su gestor de contraseñas. No se puede recuperar del hash.\n");
