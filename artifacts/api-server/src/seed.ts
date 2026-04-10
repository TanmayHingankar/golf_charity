import { db, pool } from "@workspace/db";
import { usersTable, charitiesTable, charityEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // --- Admin user ---
  const adminEmail = "admin@parforporpuse.com";
  const existingAdmin = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);

  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash("Admin@123456", 10);
    await db.insert(usersTable).values({
      name: "Platform Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
      charityPercentage: 10,
    });
    console.log("✅ Admin user created:");
    console.log("   Email:    admin@parforporpuse.com");
    console.log("   Password: Admin@123456");
  } else {
    console.log("ℹ️  Admin user already exists");
  }

  // --- Sample charities ---
  const existingCharities = await db.select().from(charitiesTable);
  if (existingCharities.length === 0) {
    const charities = [
      {
        name: "Children's Heart Surgery Fund",
        description: "Supporting families affected by congenital heart disease, funding life-saving surgeries and aftercare for children across the UK. Every pound raised goes directly to paediatric heart patients.",
        imageUrl: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&auto=format&fit=crop&q=60",
        website: "https://www.chsf.org.uk",
        featured: true,
        totalContributions: 48750.0,
        subscriberCount: 142,
      },
      {
        name: "Veterans Golf Charity",
        description: "Using golf as therapy for veterans and their families, providing mental health support and community through sport. Helping those who served find peace on the fairway.",
        imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&auto=format&fit=crop&q=60",
        website: "https://example.com/veterans-golf",
        featured: true,
        totalContributions: 32100.0,
        subscriberCount: 98,
      },
      {
        name: "Youth Sport Foundation",
        description: "Giving underprivileged young people access to sport, coaching and mentorship. Every child deserves a level playing field, and golf is a game for life.",
        imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=60",
        website: "https://example.com/youth-sport",
        featured: true,
        totalContributions: 27890.0,
        subscriberCount: 83,
      },
      {
        name: "Cancer Research Golf Alliance",
        description: "Raising vital funds for cancer research through the power of the golfing community. Putting for a cure, one round at a time.",
        imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=60",
        website: "https://example.com/cancer-research-golf",
        featured: false,
        totalContributions: 19450.0,
        subscriberCount: 67,
      },
      {
        name: "Mental Health Fairways",
        description: "Combating the mental health crisis through golf therapy programmes, offering free sessions to those in crisis or recovering from mental illness.",
        imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60",
        website: "https://example.com/mental-health-fairways",
        featured: false,
        totalContributions: 15200.0,
        subscriberCount: 51,
      },
      {
        name: "Green Planet Golf Trust",
        description: "Promoting environmental sustainability within golf — restoring habitats, reducing carbon footprint and educating clubs on eco-friendly course management.",
        imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&auto=format&fit=crop&q=60",
        website: "https://example.com/green-planet-golf",
        featured: false,
        totalContributions: 11340.0,
        subscriberCount: 39,
      },
    ];

    const inserted = await db.insert(charitiesTable).values(charities).returning();
    console.log(`✅ Created ${inserted.length} charities`);

    // Charity events
    const events = [
      {
        charityId: inserted[0]!.id,
        title: "Annual Charity Golf Day — Wentworth",
        description: "Join us for our flagship fundraising golf day at the iconic Wentworth course. All proceeds support paediatric heart surgery.",
        eventDate: new Date("2026-07-15"),
      },
      {
        charityId: inserted[0]!.id,
        title: "Putting Challenge — London",
        description: "A 9-hole putting challenge open to all abilities in Hyde Park. Family friendly. Donations welcome.",
        eventDate: new Date("2026-05-20"),
      },
      {
        charityId: inserted[1]!.id,
        title: "Veterans Golf Classic 2026",
        description: "Our annual tournament celebrating veteran golfers and raising funds for mental health support programmes.",
        eventDate: new Date("2026-06-10"),
      },
      {
        charityId: inserted[2]!.id,
        title: "Junior Golf Academy Open Day",
        description: "Free taster sessions for young people aged 8-18. Come discover the joy of golf and support a worthy cause.",
        eventDate: new Date("2026-05-01"),
      },
      {
        charityId: inserted[3]!.id,
        title: "Cancer Research Scramble — St Andrews",
        description: "A 4-ball scramble at the home of golf raising money for cancer research. All abilities welcome.",
        eventDate: new Date("2026-08-22"),
      },
    ];

    await db.insert(charityEventsTable).values(events);
    console.log(`✅ Created ${events.length} charity events`);
  } else {
    console.log(`ℹ️  Charities already exist (${existingCharities.length} found — skipping)`);
  }

  console.log("\n✅ Seeding complete!");
  console.log("────────────────────────────────────");
  console.log("Admin Login:");
  console.log("  Email:    admin@parforporpuse.com");
  console.log("  Password: Admin@123456");
  console.log("────────────────────────────────────\n");

  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
