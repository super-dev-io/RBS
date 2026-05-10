import dotenv from "dotenv";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_TEMPLATE_CONFIG } from "./services/templating/types";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@resumetailor.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const name = process.env.SEED_ADMIN_NAME ?? "Root Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: { email, passwordHash, name, role: Role.ADMIN },
    });
    console.log(`Created admin: ${admin.email}`);

    await prisma.resumeTemplate.create({
      data: {
        name: "Modern Minimal",
        description: "Clean, ATS-friendly single-column template.",
        config: DEFAULT_TEMPLATE_CONFIG as object,
        createdByAdminId: admin.id,
      },
    });
    console.log("Created default template: Modern Minimal");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
