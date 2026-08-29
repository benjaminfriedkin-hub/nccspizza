import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: npx tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const base64 = Buffer.from(hash, "utf8").toString("base64");

console.log(`ADMIN_PASSWORD_HASH_BASE64="${base64}"`);
console.log("(paste the line above into .env / your host's env vars as-is)");
