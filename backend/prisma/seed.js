// prisma/seed.js
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const pkg = await import("@prisma/client");
const { PrismaClient } = pkg;
const prisma = new PrismaClient({}); // explicit options object

const seedUsers = [
  { email: "emma.thompson@example.com", fullName: "Emma Thompson", password: "123456", profilePic: "https://randomuser.me/api/portraits/women/1.jpg" },
  { email: "olivia.miller@example.com", fullName: "Olivia Miller", password: "123456", profilePic: "https://randomuser.me/api/portraits/women/2.jpg" },
  { email: "sophia.davis@example.com", fullName: "Sophia Davis", password: "123456", profilePic: "https://randomuser.me/api/portraits/women/3.jpg" },
  { email: "ava.wilson@example.com", fullName: "Ava Wilson", password: "123456", profilePic: "https://randomuser.me/api/portraits/women/4.jpg" },
  { email: "isabella.brown@example.com", fullName: "Isabella Brown", password: "123456", profilePic: "https://randomuser.me/api/portraits/women/5.jpg" },
  { email: "mia.johnson@example.com", fullName: "Mia Johnson", password: "123456", profilePic: "https://randomuser.me/api/portraits/women/6.jpg" },
  { email: "charlotte.williams@example.com", fullName: "Charlotte Williams", password: "123456", profilePic: "https://randomuser.me/api/portraits/women/7.jpg" },
  { email: "amelia.garcia@example.com", fullName: "Amelia Garcia", password: "123456", profilePic: "https://randomuser.me/api/portraits/women/8.jpg" },
  { email: "james.anderson@example.com", fullName: "James Anderson", password: "123456", profilePic: "https://randomuser.me/api/portraits/men/1.jpg" },
  { email: "william.clark@example.com", fullName: "William Clark", password: "123456", profilePic: "https://randomuser.me/api/portraits/men/2.jpg" },
  { email: "benjamin.taylor@example.com", fullName: "Benjamin Taylor", password: "123456", profilePic: "https://randomuser.me/api/portraits/men/3.jpg" },
  { email: "lucas.moore@example.com", fullName: "Lucas Moore", password: "123456", profilePic: "https://randomuser.me/api/portraits/men/4.jpg" },
  { email: "henry.jackson@example.com", fullName: "Henry Jackson", password: "123456", profilePic: "https://randomuser.me/api/portraits/men/5.jpg" },
  { email: "alexander.martin@example.com", fullName: "Alexander Martin", password: "123456", profilePic: "https://randomuser.me/api/portraits/men/6.jpg" },
  { email: "daniel.rodriguez@example.com", fullName: "Daniel Rodriguez", password: "123456", profilePic: "https://randomuser.me/api/portraits/men/7.jpg" },
];

async function seedDatabase() {
  try {
    const hashedUsers = await Promise.all(
      seedUsers.map(async (u) => ({
        email: u.email,
        fullName: u.fullName,
        password: await bcrypt.hash(u.password, 10),
        profilePic: u.profilePic,
      }))
    );

    await prisma.user.createMany({
      data: hashedUsers,
      skipDuplicates: true,
    });

    console.log("✨ Seed completed");
  } catch (err) {
    console.error("Seed error:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await seedDatabase();
