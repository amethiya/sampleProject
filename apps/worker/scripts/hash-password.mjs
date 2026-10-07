// Usage: npm run hash-password -w @rr/worker -- '<password>'
// Prints the value for the ADMIN_PASSWORD_HASH secret (same PBKDF2 scheme as src/auth.ts).
import { webcrypto as crypto, randomBytes } from "node:crypto";

const password = process.argv[2];
if (!password) throw new Error("Pass the password as an argument");
const iterations = 100_000;
const salt = randomBytes(16);
const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
console.log(`pbkdf2$${iterations}$${salt.toString("hex")}$${Buffer.from(bits).toString("hex")}`);
