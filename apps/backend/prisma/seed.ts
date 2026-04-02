import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.payment.deleteMany();
  await prisma.authCode.deleteMany();
  await prisma.driverLocation.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.routePoint.deleteMany();
  await prisma.route.deleteMany();

  const route33 = await prisma.route.create({
    data: {
      name: "33 liniya",
      price: 5000,
      points: {
        create: [
          {
            name: "A punkt",
            lat: 41.3111,
            lng: 69.2797,
            radius: 80,
          },
          {
            name: "B punkt",
            lat: 41.3138,
            lng: 69.2851,
            radius: 80,
          },
          {
            name: "C punkt",
            lat: 41.3171,
            lng: 69.2913,
            radius: 80,
          },
        ],
      },
    },
    include: {
      points: true,
    },
  });

  const driver = await prisma.driver.create({
    data: {
      name: "Abdullayev Ulugbek",
      phone: "+998901234567",
      carNumber: "10A111UZ",
      cardNumber: "8600123412341234",
      paymentSlug: "driver-1",
      status: "online",
      routeId: route33.id,
    },
  });

  await prisma.driverLocation.create({
    data: {
      driverId: driver.id,
      lat: route33.points[0].lat,
      lng: route33.points[0].lng,
    },
  });

  await prisma.driver.create({
    data: {
      name: "Alisher D",
      phone: "+998901111111",
      carNumber: "01A234BC",
      paymentSlug: "driver-2",
      status: "online",
      routeId: route33.id,
    },
  });

  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
