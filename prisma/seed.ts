// 注意：这里的路径要根据你第一个文件的实际位置来调整！
// 如果第一个文件在同级目录，就是 "./prisma"；如果在 src/lib 下，可能是 "../src/lib/prisma"
import { prisma } from "../src/lib/prisma";
import { seedDefaultData } from "../src/lib/seed-data"; // 保持你原来的 seed-data 路径

async function main() {
  console.log("Start seeding...");
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