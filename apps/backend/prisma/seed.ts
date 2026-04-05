import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/security/password";

const prisma = new PrismaClient();

async function main() {
  await prisma.ledgerEntry.deleteMany();
  await prisma.cashEntry.deleteMany();
  await prisma.paymentCallbackLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.authCode.deleteMany();
  await prisma.queueEvent.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.queueCounter.deleteMany();
  await prisma.driverLocation.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.routePoint.deleteMany();
  await prisma.route.deleteMany();
  await prisma.alliance.deleteMany();

  const superAdminPassword = "SuperAdmin123!";
  const allianceAdminPassword = "AllianceAdmin123!";

  const superAdmin = await prisma.adminUser.create({
    data: {
      fullName: "Damastic Super Admin",
      email: "superadmin@damastic.uz",
      passwordHash: hashPassword(superAdminPassword),
      role: "super_admin",
    },
  });

  const chilonzorAlliance = await prisma.alliance.create({
    data: {
      name: "Chilonzor Damas Uyushmasi",
      slug: "chilonzor-damas",
      admins: {
        create: {
          fullName: "Chilonzor Alliance Admin",
          email: "chilonzor@damastic.uz",
          passwordHash: hashPassword(allianceAdminPassword),
          role: "alliance_admin",
        },
      },
    },
    include: {
      admins: true,
    },
  });

  const route = await prisma.route.create({
    data: {
      allianceId: chilonzorAlliance.id,
      name: "Chilonzor -> Olmazor",
      price: 5000,
      points: {
        create: [
          {
            name: "Bekat A",
            lat: 41.2746412,
            lng: 69.2049774,
            radius: 80,
          },
          {
            name: "Bekat B",
            lat: 41.2899139,
            lng: 69.2237721,
            radius: 80,
          },
          {
            name: "Bekat C",
            lat: 41.3106298,
            lng: 69.2441732,
            radius: 80,
          },
        ],
      },
    },
    include: {
      points: true,
    },
  });

  const [vehicleOne, vehicleTwo] = await prisma.$transaction([
    prisma.vehicle.create({
      data: {
        allianceId: chilonzorAlliance.id,
        routeId: route.id,
        plateNumber: "10A111AA",
        model: "Chevrolet Damas",
        seatCount: 11,
        qrToken: "qr-10a111aa",
      },
    }),
    prisma.vehicle.create({
      data: {
        allianceId: chilonzorAlliance.id,
        routeId: route.id,
        plateNumber: "10A222BB",
        model: "Chevrolet Damas",
        seatCount: 11,
        qrToken: "qr-10a222bb",
      },
    }),
  ]);

  const [driverOne, driverTwo] = await prisma.$transaction([
    prisma.driver.create({
      data: {
        allianceId: chilonzorAlliance.id,
        vehicleId: vehicleOne.id,
        routeId: route.id,
        name: "Abdullayev Ulugbek",
        phone: "+998901234567",
        carNumber: vehicleOne.plateNumber,
        cardNumber: "8600123412341234",
        paymentSlug: "10a111aa-driver",
        status: "online",
      },
    }),
    prisma.driver.create({
      data: {
        allianceId: chilonzorAlliance.id,
        vehicleId: vehicleTwo.id,
        routeId: route.id,
        name: "Qodirov Alisher",
        phone: "+998901111111",
        carNumber: vehicleTwo.plateNumber,
        cardNumber: "8600432112345678",
        paymentSlug: "10a222bb-driver",
        status: "offline",
      },
    }),
  ]);

  const [walletOne, walletTwo] = await prisma.$transaction([
    prisma.wallet.create({
      data: {
        driverId: driverOne.id,
        balance: 15000,
      },
    }),
    prisma.wallet.create({
      data: {
        driverId: driverTwo.id,
        balance: 5000,
      },
    }),
  ]);

  await prisma.driverLocation.create({
    data: {
      driverId: driverOne.id,
      lat: route.points[0].lat,
      lng: route.points[0].lng,
    },
  });

  const [payment, cashEntry, activeQueue] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        driverId: driverOne.id,
        vehicleId: vehicleOne.id,
        amount: 10000,
        status: "success",
        paymentSystem: "payme",
        externalTransactionId: "payme-seed-001",
        walletPostedAt: new Date(),
      },
    }),
    prisma.cashEntry.create({
      data: {
        allianceId: chilonzorAlliance.id,
        driverId: driverOne.id,
        vehicleId: vehicleOne.id,
        passengerCount: 1,
        fareAmount: 5000,
        totalAmount: 5000,
      },
    }),
    prisma.queue.create({
      data: {
        driverId: driverOne.id,
        pointId: route.points[0].id,
        position: 1,
      },
    }),
  ]);

  await prisma.queueCounter.create({
    data: {
      pointId: route.points[0].id,
      nextPosition: 2,
    },
  });

  await prisma.$transaction([
    prisma.queueEvent.create({
      data: {
        queueId: activeQueue.id,
        driverId: driverOne.id,
        pointId: route.points[0].id,
        eventType: "joined",
        position: 1,
      },
    }),
    prisma.ledgerEntry.create({
      data: {
        walletId: walletOne.id,
        driverId: driverOne.id,
        paymentId: payment.id,
        entryType: "electronic_in",
        amount: 10000,
        note: "Seed electronic payment",
      },
    }),
    prisma.ledgerEntry.create({
      data: {
        walletId: walletOne.id,
        driverId: driverOne.id,
        cashEntryId: cashEntry.id,
        entryType: "cash_in",
        amount: 5000,
        note: "Seed cash entry",
      },
    }),
    prisma.ledgerEntry.create({
      data: {
        walletId: walletTwo.id,
        driverId: driverTwo.id,
        entryType: "adjustment_in",
        amount: 5000,
        note: "Initial wallet funding",
      },
    }),
  ]);

  console.log("Seed completed");
  console.log(`Super admin: ${superAdmin.email} / ${superAdminPassword}`);
  console.log(
    `Alliance admin: ${chilonzorAlliance.admins[0]?.email ?? "n/a"} / ${allianceAdminPassword}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
