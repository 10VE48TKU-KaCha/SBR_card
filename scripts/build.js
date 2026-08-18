const { execSync } = require("child_process");

// Fallback DATABASE_URL if not provided during Railway build step
if (!process.env.DATABASE_URL) {
  console.log("⚠️ DATABASE_URL not set in env, applying build fallback URL...");
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/supapburut_db?schema=public";
}

try {
  console.log("📦 Generating Prisma Client...");
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });

  console.log("🏗️ Building Next.js application...");
  execSync("npx next build", { stdio: "inherit", env: process.env });
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}
