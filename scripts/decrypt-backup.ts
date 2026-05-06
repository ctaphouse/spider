/**
 * Decrypt a Spider backup file (.sqlite.enc) → .sqlite
 *
 * Usage:
 *   bun run scripts/decrypt-backup.ts <input.sqlite.enc> <output.sqlite> <password>
 *
 * File format: [salt:32][iv:12][authTag:16][ciphertext]
 * Encryption: PBKDF2 (100k rounds, SHA-256) + AES-256-GCM
 */
import { pbkdf2Sync, createDecipheriv } from "crypto";
import { readFileSync, writeFileSync } from "fs";

const [inputPath, outputPath, password] = Bun.argv.slice(2);

if (!inputPath || !outputPath || !password) {
  console.error("Usage: bun run scripts/decrypt-backup.ts <input.sqlite.enc> <output.sqlite> <password>");
  process.exit(1);
}

const data = readFileSync(inputPath);

if (data.length < 60) {
  console.error("Error: File too small to be a valid encrypted backup.");
  process.exit(1);
}

const salt       = data.subarray(0, 32);
const iv         = data.subarray(32, 44);
const tag        = data.subarray(44, 60);
const ciphertext = data.subarray(60);

const key = pbkdf2Sync(password, salt, 100_000, 32, "sha256");
const decipher = createDecipheriv("aes-256-gcm", key, iv);
decipher.setAuthTag(tag);

try {
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  writeFileSync(outputPath, decrypted);
  console.log(`Decrypted ${data.length} bytes → ${outputPath} (${decrypted.length} bytes)`);
} catch {
  console.error("Error: Decryption failed — wrong password or corrupted file.");
  process.exit(1);
}
