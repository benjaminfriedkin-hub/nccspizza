import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: npx tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
// Escaped for direct paste into .env: Next.js expands unescaped "$word" as
// an env variable reference, which silently corrupts a raw bcrypt hash.
console.log(hash.replace(/\$/g, "\\$"));
