// test-prisma2.cjs
const { PrismaClient } = require("@prisma/client");

(async () => {
  try {
    const prisma = new PrismaClient({}); // explicit empty options
    console.log("constructed PrismaClient with {} ok");
    await prisma.$disconnect();
  } catch (err) {
    console.error("construction error:", err);
    process.exit(1);
  }
})();
