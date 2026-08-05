import { execSync } from "child_process";
import { db } from "../src/lib/db";

async function main() {
  const userCount = await db.user.count();
  if (userCount > 0) {
    console.log(`Database already seeded (${userCount} users). Skipping.`);
    return;
  }
  console.log("Empty database — running seed...");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
}

main()
  .catch((err) => {
    console.error("Seed check failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
