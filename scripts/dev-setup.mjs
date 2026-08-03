#!/usr/bin/env node
/**
 * One-shot local dev bootstrap for JackalsVC.
 * Usage: npm run dev:setup
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { execSync } from "node:child_process";

const DEV_URL = "http://localhost:3005";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function ensureEnvFile() {
  if (existsSync(".env")) {
    console.log("✓ .env already exists");
    return;
  }

  if (!existsSync(".env.example")) {
    console.error("Missing .env.example — cannot create .env");
    process.exit(1);
  }

  copyFileSync(".env.example", ".env");

  const secret = randomBytes(32).toString("base64");
  let env = readFileSync(".env", "utf8");
  env = env.replace(/AUTH_SECRET=""/, `AUTH_SECRET="${secret}"`);
  writeFileSync(".env", env);

  console.log("✓ Created .env from .env.example");
  console.log(`  AUTH_SECRET generated automatically`);
  console.log(`  Dev URL: ${DEV_URL}`);
}

console.log("Jackals VC — local dev setup\n");

run("npm install");
ensureEnvFile();
run("npx prisma generate");

try {
  run("npx prisma migrate deploy");
  console.log("✓ Database migrations applied");
} catch {
  console.log("→ migrate deploy skipped; applying schema with db push…");
  run("npx prisma db push");
}

console.log(`\nStarting dev server at ${DEV_URL} …\n`);
run("npm run dev");
