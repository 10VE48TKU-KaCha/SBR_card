const { execSync } = require("child_process");

// Fallback DATABASE_URL if not provided during Railway build step
if (!process.env.DATABASE_URL) {
  console.log("⚠️ DATABASE_URL not set in env, applying build fallback URL...");
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/supapburut_db?schema=public";
}

try {
  console.log("📦 Generating Prisma Client...");
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });

  // Safely attempt prisma db push if live DB is reachable during build
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost:5432")) {
      console.log("🔄 Attempting database schema sync...");
      execSync("npx prisma db push --skip-generate", { stdio: "inherit", env: process.env });
    }
  } catch (dbErr) {
    console.log("ℹ️ Skipping db push during image build phase.");
  }

  console.log("🏗️ Building Next.js application...");
  execSync("npx next build", { stdio: "inherit", env: process.env });
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}
