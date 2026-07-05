// prisma/seed.ts
// 注意：这里的相对路径请根据你第一个文件的实际位置调整！
// 如果第一个文件在 src/lib/prisma.ts，这里就是 "../src/lib/prisma"
import { prisma } from "../src/lib/prisma"; 
import { seedDefaultData } from "../src/lib/seed-data";

async function main() {
  console.log("Start seeding to Supabase...");
  await seedDefaultData(prisma);
  console.log("Seed done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });