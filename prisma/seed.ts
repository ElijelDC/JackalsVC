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

function formatDemoDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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
      update: { name: user.name, role: user.role, passwordHash },
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
        category: "WEEKLY",
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
        category: "WEEKLY",
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
        category: "WEEKLY",
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
        category: "FUN",
        title: "Open Session",
        dayOfWeek: 6,
        startTime: "10:00",
        endTime: "12:00",
        location: "Sports Hall A",
        level: "All Levels",
        coach: "Rotating coaches",
        description: "Mixed-level social play. Everyone welcome.",
        attendanceUrl: "https://forms.gle/example-open",
        paymentUrl: "https://forms.gle/example-open-payment",
        reclubUsername: "JackalsVC",
        sessionFee: 10,
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
        attendanceUrl: "https://forms.gle/example-tournament",
        sessionFee: 60,
        clubIban: "IE29 AIBK 9311 5212 3456 78",
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
        attendanceUrl: "https://forms.gle/example-preseason-camp",
      },
    ],
  });

  await syncAllTrainingSessionEvents();

  // Demo calendar days with multiple events (for UI testing)
  const nextDay = (dayOfWeek: number) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const daysUntil = (dayOfWeek - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + daysUntil);
    return date;
  };

  const atTime = (base: Date, hours: number, minutes = 0) => {
    const date = new Date(base);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const busySaturday = nextDay(6);
  const busyFriday = nextDay(5);

  await prisma.event.createMany({
    data: [
      // 3 events on the same Saturday: Open Session (synced FUN) + clinic + mini tournament
      {
        title: "Serve & Pass Clinic",
        description:
          "Skills clinic focused on serving and passing — open to all members.",
        startDate: atTime(busySaturday, 13, 0),
        endDate: atTime(busySaturday, 15, 0),
        type: "SOCIAL",
        location: "Sports Hall B",
        attendanceUrl: "https://forms.gle/example-clinic",
        paymentUrl: "https://forms.gle/example-clinic-payment",
        sessionFee: 15,
        reclubUsername: "JackalsVC",
      },
      {
        title: "Club Mini Tournament",
        description:
          "Friendly round-robin — mixed teams, all levels welcome.",
        startDate: atTime(busySaturday, 16, 0),
        endDate: atTime(busySaturday, 18, 0),
        type: "TOURNAMENT",
        location: "Sports Hall A",
        attendanceUrl: "https://forms.gle/example-mini-tournament",
        sessionFee: 35,
        clubIban: "IE29 AIBK 9311 5212 3456 78",
      },
      // 2 events on the same Friday
      {
        title: "Setter Workshop",
        description: "Hands-on setting drills with Coach Sarah.",
        startDate: atTime(busyFriday, 18, 0),
        endDate: atTime(busyFriday, 19, 30),
        type: "SOCIAL",
        location: "Sports Hall A",
        attendanceUrl: "https://forms.gle/example-setter-workshop",
        paymentUrl: "https://forms.gle/example-setter-workshop-payment",
        sessionFee: 12,
        reclubUsername: "JackalsVC",
      },
      {
        title: "Friday Night Social",
        description: "Casual mixed games and music after training.",
        startDate: atTime(busyFriday, 20, 0),
        endDate: atTime(busyFriday, 22, 0),
        type: "SOCIAL",
        location: "Sports Hall A",
      },
    ],
  });

  console.log(
    `Calendar demo: ${formatDemoDate(busySaturday)} has Open Session + clinic + tournament (3 events).`,
  );
  console.log(
    `Calendar demo: ${formatDemoDate(busyFriday)} has setter workshop + social (2 events).`,
  );

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

  await prisma.galleryPhoto.deleteMany();
  await prisma.galleryAlbum.deleteMany();

  const galleryCover = (title: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=7f1d1d&color=fca5a5&size=800&bold=true`;

  const galleryPhoto = (label: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=2a2b2b&color=fca5a5&size=800`;

  await prisma.galleryAlbum.create({
    data: {
      title: "League Final Victory",
      description: "Celebrating our 2025 league title — from the final whistle to the trophy lift.",
      coverImageUrl: galleryCover("League Final"),
      category: "MATCH",
      featured: true,
      sortOrder: 0,
      photos: {
        create: [
          {
            title: "Champions",
            caption: "Lifting the league trophy together.",
            imageUrl: galleryPhoto("Champions"),
            sortOrder: 0,
          },
          {
            title: "Final point",
            caption: "The moment we clinched the title.",
            imageUrl: galleryPhoto("Final Point"),
            sortOrder: 1,
          },
          {
            title: "Team huddle",
            caption: "Pre-match huddle before the grand final.",
            imageUrl: galleryPhoto("Team Huddle"),
            sortOrder: 2,
          },
        ],
      },
    },
  });

  await prisma.galleryAlbum.create({
    data: {
      title: "Tuesday Night Training",
      description: "Intermediate squad sessions — blocking, attacking, and game play.",
      coverImageUrl: galleryCover("Training Night"),
      category: "TRAINING",
      featured: true,
      sortOrder: 1,
      photos: {
        create: [
          {
            caption: "Blocking drills at the net.",
            imageUrl: galleryPhoto("Blocking Drills"),
            sortOrder: 0,
          },
          {
            caption: "Spike practice with the advanced squad.",
            imageUrl: galleryPhoto("Spike Practice"),
            sortOrder: 1,
          },
        ],
      },
    },
  });

  await prisma.galleryAlbum.create({
    data: {
      title: "Summer BBQ Social",
      description: "End of season celebration with the whole club off the court.",
      coverImageUrl: galleryCover("Summer BBQ"),
      category: "SOCIAL",
      featured: true,
      sortOrder: 2,
      photos: {
        create: [
          {
            caption: "Club members at the summer BBQ.",
            imageUrl: galleryPhoto("BBQ Group"),
            sortOrder: 0,
          },
          {
            caption: "Awards and speeches in the sunshine.",
            imageUrl: galleryPhoto("BBQ Awards"),
            sortOrder: 1,
          },
        ],
      },
    },
  });

  await prisma.galleryAlbum.create({
    data: {
      title: "Regional Tournament",
      description: "Weekend tournament — pool play, knockouts, and team photos.",
      coverImageUrl: galleryCover("Regional Tournament"),
      category: "EVENT",
      featured: true,
      sortOrder: 3,
      photos: {
        create: [
          {
            caption: "Team photo before the semi-final.",
            imageUrl: galleryPhoto("Tournament Team"),
            sortOrder: 0,
          },
          {
            caption: "Hard-fought 3-2 victory on the road.",
            imageUrl: galleryPhoto("Away Day Win"),
            sortOrder: 1,
          },
          {
            caption: "Warm-up before first serve.",
            imageUrl: galleryPhoto("Tournament Warmup"),
            sortOrder: 2,
          },
        ],
      },
    },
  });

  await prisma.achievement.deleteMany();
  await prisma.achievement.createMany({
    data: [
      {
        title: "Division 3 Mens Champions",
        season: "2024/25",
        description:
          "Secured 1st place in Volleyball Ireland's National League, being unbeaten in pool stages and playing 5-set thrillers in both quarter and semi finals against formidable opponents, finishing it off with a dominant win in the Grand Finals.",
        imageUrl: "/achievements/d3m-champions.jpg",
        type: "LEAGUE",
        sortOrder: 0,
      },
      {
        title: "IVI Mens 2-Day Pre-Season Tournament Champions",
        season: "2025",
        description:
          "Secured 1st place in IVI 2-day Preseason Tournament, after countless of tough battles against the other teams in day 1 the Jackal's Mens team managed to clinch play-offs, come day 2 they then manage to get past close battles in QF, SF and in the grand final edging out their opponents in a set for set battle, they came out on top!",
        imageUrl: "/achievements/ivi-preseason-champions.jpg",
        type: "TOURNAMENT",
        sortOrder: 1,
      },
      {
        title: "IVI Mens Tournament Champions",
        season: "2025",
        description:
          "Secured 1st place in IVI Men's Tournament, after fighting tough for a playoff's spot in their pool, they managed to clinch victory after a tough semi final's battle and closely edging out Pancada in the Men's Finals",
        imageUrl: "/achievements/ivi-tournament-champions.jpg",
        type: "TOURNAMENT",
        sortOrder: 2,
      },
    ],
  });

  await prisma.clubTeamMember.deleteMany();
  await prisma.clubTeam.deleteMany();

  const teamAvatar = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7f1d1d&color=fca5a5&size=256&bold=true`;

  await prisma.clubTeam.create({
    data: {
      name: "Men's 1st Team",
      level: "Regional league",
      description:
        "Our top competitive squad, training twice weekly and competing in the regional league throughout the season.",
      details:
        "Training: Tuesdays & Thursdays, 7:30–9:30pm at the main hall.\n\nWe compete in Division 3 of the regional league and enter selected weekend tournaments. Selection is based on attendance, attitude, and match performance.",
      sortOrder: 0,
      members: {
        create: [
          {
            name: "Alex Morgan",
            role: "COACH",
            position: "Head Coach",
            photoUrl: teamAvatar("Alex Morgan"),
            sortOrder: 0,
          },
          {
            name: "James Patel",
            role: "COACH",
            position: "Assistant Coach",
            photoUrl: teamAvatar("James Patel"),
            sortOrder: 1,
          },
          {
            name: "Mike Chen",
            role: "PLAYER",
            position: "Outside Hitter",
            photoUrl: teamAvatar("Mike Chen"),
            sortOrder: 0,
          },
          {
            name: "Liam Davis",
            role: "PLAYER",
            position: "Setter",
            photoUrl: teamAvatar("Liam Davis"),
            sortOrder: 1,
          },
          {
            name: "Tom Hughes",
            role: "PLAYER",
            position: "Opposite",
            photoUrl: teamAvatar("Tom Hughes"),
            sortOrder: 2,
          },
          {
            name: "Sophie Taylor",
            role: "PLAYER",
            position: "Middle Blocker",
            photoUrl: teamAvatar("Sophie Taylor"),
            sortOrder: 3,
          },
          {
            name: "Priya Sharma",
            role: "PLAYER",
            position: "Libero",
            photoUrl: teamAvatar("Priya Sharma"),
            sortOrder: 4,
          },
        ],
      },
    },
  });

  await prisma.clubTeam.create({
    data: {
      name: "Women's 1st Team",
      level: "Regional league",
      description:
        "A competitive women's side focused on league play, tournament weekends, and pushing for promotion.",
      details:
        "Training: Mondays & Wednesdays, 7:00–9:00pm.\n\nWe play in the regional women's league and target promotion this season. New players are welcome at open trials in September.",
      sortOrder: 1,
      members: {
        create: [
          {
            name: "Sarah Jones",
            role: "COACH",
            position: "Head Coach",
            photoUrl: teamAvatar("Sarah Jones"),
            sortOrder: 0,
          },
          {
            name: "Emma Williams",
            role: "COACH",
            position: "Assistant Coach",
            photoUrl: teamAvatar("Emma Williams"),
            sortOrder: 1,
          },
          {
            name: "Olivia Brown",
            role: "PLAYER",
            position: "Outside Hitter",
            photoUrl: teamAvatar("Olivia Brown"),
            sortOrder: 0,
          },
          {
            name: "Chloe Reid",
            role: "PLAYER",
            position: "Setter",
            photoUrl: teamAvatar("Chloe Reid"),
            sortOrder: 1,
          },
          {
            name: "Hannah Clarke",
            role: "PLAYER",
            position: "Middle Blocker",
            photoUrl: teamAvatar("Hannah Clarke"),
            sortOrder: 2,
          },
          {
            name: "Grace Miller",
            role: "PLAYER",
            position: "Libero",
            photoUrl: teamAvatar("Grace Miller"),
            sortOrder: 3,
          },
        ],
      },
    },
  });

  await prisma.clubTeam.create({
    data: {
      name: "Development Squad",
      level: "All levels welcome",
      description:
        "For players building confidence and skills — ideal if you are new to the club or working toward league selection.",
      details:
        "Sessions run every Friday, 6:30–8:00pm.\n\nFocused on fundamentals, game understanding, and match play in a supportive environment. No league commitment required.",
      sortOrder: 2,
      members: {
        create: [
          {
            name: "James Patel",
            role: "COACH",
            position: "Lead Coach",
            photoUrl: teamAvatar("James Patel"),
            sortOrder: 0,
          },
          {
            name: "Noah Brooks",
            role: "PLAYER",
            position: "Outside Hitter",
            photoUrl: teamAvatar("Noah Brooks"),
            sortOrder: 0,
          },
          {
            name: "Ella Wright",
            role: "PLAYER",
            position: "Setter",
            photoUrl: teamAvatar("Ella Wright"),
            sortOrder: 1,
          },
          {
            name: "Ryan Cooper",
            role: "PLAYER",
            position: "Middle Blocker",
            photoUrl: teamAvatar("Ryan Cooper"),
            sortOrder: 2,
          },
          {
            name: "Mia Foster",
            role: "PLAYER",
            position: "Libero",
            photoUrl: teamAvatar("Mia Foster"),
            sortOrder: 3,
          },
        ],
      },
    },
  });

  await prisma.clubTeam.create({
    data: {
      name: "Social & Fun Sessions",
      level: "Open to everyone",
      description:
        "Mixed-level play with no league commitment. A great way to stay active, meet members, and enjoy the game.",
      details:
        "Drop-in every Sunday, 10:00am–12:00pm.\n\nMixed teams, relaxed rules, and all abilities welcome. Just turn up in comfortable kit — no selection or sign-up needed.",
      sortOrder: 3,
      members: {
        create: [
          {
            name: "Alex Morgan",
            role: "COACH",
            position: "Session Coordinator",
            photoUrl: teamAvatar("Alex Morgan"),
            sortOrder: 0,
          },
          {
            name: "Demo Member",
            role: "PLAYER",
            position: "All-rounder",
            photoUrl: teamAvatar("Demo Member"),
            sortOrder: 0,
          },
          {
            name: "Club Admin",
            role: "PLAYER",
            position: "All-rounder",
            photoUrl: teamAvatar("Club Admin"),
            sortOrder: 1,
          },
        ],
      },
    },
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
