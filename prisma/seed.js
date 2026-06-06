const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default bank accounts
  const kbank = await prisma.bankAccount.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      bankName: 'ธนาคารกสิกรไทย (KBANK)',
      accountNumber: '123-4-56789-0',
      accountName: 'สมชาย มั่งมี',
      qrType: 'PROMPTPAY'
    }
  });

  const scb = await prisma.bankAccount.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      bankName: 'ธนาคารไทยพาณิชย์ (SCB)',
      accountNumber: '098-7-65432-1',
      accountName: 'สมหญิง ร่ำรวย',
      qrType: 'PROMPTPAY'
    }
  });

  console.log('Bank accounts seeded.');

  // Create default admin user (admin / admin1234)
  const hashedAdminPassword = bcrypt.hashSync('admin1234', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedAdminPassword,
      name: 'System Administrator',
      role: 'ADMIN'
    }
  });

  // Create default test user (user / user1234)
  const hashedUserPassword = bcrypt.hashSync('user1234', 10);
  const testUser = await prisma.user.upsert({
    where: { username: 'user' },
    update: {
      phone: '0812345678'
    },
    create: {
      username: 'user',
      phone: '0812345678',
      password: hashedUserPassword,
      name: 'Test User',
      role: 'USER',
      assignedAccountId: kbank.id
    }
  });

  console.log('Users seeded:', {
    admin: admin.username,
    testUser: testUser.username,
    testUserPhone: testUser.phone
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
