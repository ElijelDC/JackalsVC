import "dotenv/config";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { syncAllTrainingSessionEvents } from "../src/lib/training-events";

const dbUrl =
  process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "dev.db")}`;

const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const demoUsers = [
    {
      name: "Club Admin",
      email: "admin@jackalsvc.com",
      role: "ADMIN",
    },
    {
      name: "Demo Member",
      email: "member@jackalsvc.com",
      role: "MEMBER",
    },
    {
      name: "Sarah Jones",
      email: "sarah.jones@jackalsvc.com",
      role: "MEMBER",
    },
    {
      name: "Mike Chen",
      email: "mike.chen@jackalsvc.com",
      role: "MEMBER",
    },
    {
      name: "Emma Williams",
      email: "emma.williams@jackalsvc.com",
      role: "MEMBER",
    },
    {
      name: "James Patel",
      email: "james.patel@jackalsvc.com",
      role: "MEMBER",
    },
    {
      name: "Olivia Brown",
      email: "olivia.brown@jackalsvc.com",
      role: "MEMBER",
    },
    {
      name: "Liam Davis",
      email: "liam.davis@jackalsvc.com",
      role: "MEMBER",
    },
    {
      name: "Sophie Taylor",
      email: "sophie.taylor@jackalsvc.com",
      role: "MEMBER",
    },
    {
      name: "Alex Morgan",
      email: "alex.morgan@jackalsvc.com",
      role: "MEMBER",
    },
    {
      name: "Priya Sharma",
      email: "priya.sharma@jackalsvc.com",
      role: "MEMBER",
    },
    {
      name: "Noah Thompson",
      email: "noah.thompson@jackalsvc.com",
      role: "MEMBER",
    },
  ] as const;

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@jackalsvc.com" },
  });

  await prisma.trainingSession.deleteMany();
  const seasonStart = new Date();
  const seasonEnd = new Date();
  seasonEnd.setMonth(seasonEnd.getMonth() + 6);

  await prisma.trainingSession.createMany({
    data: [
      {
        title: "Beginners Session",
        dayOfWeek: 2,
        startTime: "18:00",
        endTime: "19:30",
        location: "Sports Hall A",
        level: "Beginner",
        coach: "Coach Sarah",
        description: "Fundamentals, passing, and serving for new players.",
        attendanceUrl: "https://forms.gle/example-beginners",
        recurringFrom: seasonStart,
        recurringTo: seasonEnd,
      },
      {
        title: "Intermediate Training",
        dayOfWeek: 2,
        startTime: "19:30",
        endTime: "21:00",
        location: "Sports Hall A",
        level: "Intermediate",
        coach: "Coach Mike",
        description: "Drills, positioning, and game scenarios.",
        attendanceUrl: "https://forms.gle/example-intermediate",
        recurringFrom: seasonStart,
        recurringTo: seasonEnd,
      },
      {
        title: "Advanced Squad",
        dayOfWeek: 4,
        startTime: "19:00",
        endTime: "21:00",
        location: "Sports Hall B",
        level: "Advanced",
        coach: "Coach James",
        description: "Competitive training for league and tournament players.",
        attendanceUrl: "https://forms.gle/example-advanced",
        recurringFrom: seasonStart,
        recurringTo: seasonEnd,
      },
      {
        title: "Open Session",
        dayOfWeek: 6,
        startTime: "10:00",
        endTime: "12:00",
        location: "Sports Hall A",
        level: "All Levels",
        coach: "Rotating coaches",
        description: "Mixed-level play. All members welcome.",
        attendanceUrl: "https://forms.gle/example-open",
        recurringFrom: seasonStart,
        recurringTo: seasonEnd,
      },
    ],
  });

  await prisma.event.deleteMany();
  const now = new Date();
  await prisma.event.createMany({
    data: [
      {
        title: "Spring Tournament",
        description: "Regional club tournament — all squads invited.",
        startDate: new Date(now.getFullYear(), now.getMonth() + 1, 15, 9, 0),
        type: "TOURNAMENT",
        location: "Regional Sports Centre",
      },
      {
        title: "End of Season Social",
        description: "Pizza, awards, and team photos.",
        startDate: new Date(now.getFullYear(), now.getMonth() + 2, 1, 18, 0),
        type: "SOCIAL",
        location: "Club House",
      },
      {
        title: "Committee Meeting",
        description: "Monthly club committee — members welcome to observe.",
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 19, 0),
        type: "MEETING",
        location: "Online (Zoom)",
      },
      {
        title: "Pre-season Camp",
        description: "Intensive weekend camp before the new season.",
        startDate: new Date(now.getFullYear(), now.getMonth() + 1, 5, 9, 0),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 6, 17, 0),
        type: "SOCIAL",
        location: "Sports Hall A & B",
      },
    ],
  });

  await syncAllTrainingSessionEvents();

  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.membershipPlan.createMany({
    data: [
      {
        name: "Casual",
        description: "Perfect for occasional players.",
        price: 25,
        durationMonths: 1,
        features: JSON.stringify([
          "Access to open sessions",
          "Club newsletter",
          "Member events",
        ]),
      },
      {
        name: "Regular",
        description: "Our most popular plan for weekly players.",
        price: 60,
        durationMonths: 3,
        features: JSON.stringify([
          "All training sessions",
          "Tournament entry discounts",
          "Club shop 10% off",
          "Priority event booking",
        ]),
      },
      {
        name: "Competitive",
        description: "Full access for league and tournament players.",
        price: 100,
        durationMonths: 6,
        features: JSON.stringify([
          "All training sessions",
          "Squad selection eligibility",
          "Free tournament entries",
          "Club shop 15% off",
          "Personalised kit discount",
        ]),
      },
    ],
  });

  const [casual, regular, competitive] = await Promise.all([
    prisma.membershipPlan.findFirstOrThrow({ where: { name: "Casual" } }),
    prisma.membershipPlan.findFirstOrThrow({ where: { name: "Regular" } }),
    prisma.membershipPlan.findFirstOrThrow({ where: { name: "Competitive" } }),
  ]);

  const memberUsers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "member@jackalsvc.com",
          "sarah.jones@jackalsvc.com",
          "mike.chen@jackalsvc.com",
          "emma.williams@jackalsvc.com",
          "james.patel@jackalsvc.com",
          "olivia.brown@jackalsvc.com",
        ],
      },
    },
  });

  const userByEmail = Object.fromEntries(memberUsers.map((u) => [u.email, u]));

  const addMonths = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date;
  };

  const subtractMonths = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
  };

  await prisma.membership.createMany({
    data: [
      {
        userId: userByEmail["member@jackalsvc.com"].id,
        planId: casual.id,
        status: "ACTIVE",
        endDate: addMonths(1),
      },
      {
        userId: userByEmail["sarah.jones@jackalsvc.com"].id,
        planId: regular.id,
        status: "ACTIVE",
        endDate: addMonths(3),
      },
      {
        userId: userByEmail["mike.chen@jackalsvc.com"].id,
        planId: competitive.id,
        status: "ACTIVE",
        endDate: addMonths(6),
      },
      {
        userId: userByEmail["emma.williams@jackalsvc.com"].id,
        planId: casual.id,
        status: "EXPIRED",
        endDate: subtractMonths(1),
      },
      {
        userId: userByEmail["james.patel@jackalsvc.com"].id,
        planId: regular.id,
        status: "CANCELLED",
        endDate: addMonths(2),
      },
      {
        userId: userByEmail["olivia.brown@jackalsvc.com"].id,
        planId: casual.id,
        status: "ACTIVE",
        endDate: addMonths(1),
      },
    ],
  });

  await prisma.galleryImage.deleteMany();
  await prisma.galleryImage.createMany({
    data: [
      {
        title: "League Final Victory",
        description: "Celebrating our 2025 league title.",
        imageUrl: "/gallery/match-1.jpg",
        category: "MATCH",
        featured: true,
      },
      {
        title: "Tuesday Night Training",
        description: "Intermediate squad working on blocking drills.",
        imageUrl: "/gallery/training-1.jpg",
        category: "TRAINING",
        featured: true,
      },
      {
        title: "Summer BBQ Social",
        description: "End of season celebration with the whole club.",
        imageUrl: "/gallery/social-1.jpg",
        category: "SOCIAL",
        featured: true,
      },
      {
        title: "Regional Tournament",
        description: "Team photo before the semi-final.",
        imageUrl: "/gallery/event-1.jpg",
        category: "EVENT",
        featured: true,
      },
      {
        title: "Spike Practice",
        description: "Advanced squad attacking drills.",
        imageUrl: "/gallery/training-2.jpg",
        category: "TRAINING",
        featured: false,
      },
      {
        title: "Away Day Win",
        description: "Hard-fought 3-2 victory on the road.",
        imageUrl: "/gallery/match-2.jpg",
        category: "MATCH",
        featured: false,
      },
    ],
  });

  await prisma.product.deleteMany();
  await prisma.product.createMany({
    data: [
      {
        name: "Home Jersey 2025",
        description:
          "Official Jackals VC home jersey. Moisture-wicking fabric with club crest.",
        price: 45,
        category: "JERSEY",
        sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
        stock: 50,
        imageUrl: "/products/jersey-home.jpg",
      },
      {
        name: "Away Jersey 2025",
        description: "Official away kit in white and orange trim.",
        price: 45,
        category: "JERSEY",
        sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
        stock: 40,
        imageUrl: "/products/jersey-away.jpg",
      },
      {
        name: "Training T-Shirt",
        description: "Lightweight training tee with Jackals logo.",
        price: 22,
        category: "MERCH",
        sizes: JSON.stringify(["S", "M", "L", "XL"]),
        stock: 80,
        imageUrl: "/products/training-tee.jpg",
      },
      {
        name: "Volleyball",
        description: "Mikasa official match ball — club approved.",
        price: 35,
        category: "EQUIPMENT",
        sizes: null,
        stock: 25,
        imageUrl: "/products/volleyball.jpg",
      },
      {
        name: "Club Hoodie",
        description: "Warm fleece hoodie with embroidered crest.",
        price: 55,
        category: "MERCH",
        sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
        stock: 30,
        imageUrl: "/products/hoodie.jpg",
      },
      {
        name: "Knee Pads",
        description: "Professional-grade knee protection.",
        price: 28,
        category: "EQUIPMENT",
        sizes: JSON.stringify(["S/M", "L/XL"]),
        stock: 45,
        imageUrl: "/products/knee-pads.jpg",
      },
    ],
  });

  console.log("Seed complete.");
  console.log(`Admin: admin@jackalsvc.com / password123`);
  console.log(`Members: any *@jackalsvc.com account / password123`);
  console.log(`${demoUsers.length} demo users seeded (${demoUsers.length - 1} members + 1 admin).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
