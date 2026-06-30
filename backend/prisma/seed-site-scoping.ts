/**
 * One-time data migration: assign all existing records to the current site.
 *
 * Usage:
 *   npx ts-node prisma/seed-site-scoping.ts
 *
 * Requires DATABASE_URL and SITE_ID in .env
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const siteId = process.env.SITE_ID;
  if (!siteId) {
    console.error("SITE_ID environment variable is required");
    process.exit(1);
  }

  // Resolve the internal Site.id from the human-readable siteId
  const site = await prisma.site.findUnique({ where: { siteId } });
  if (!site) {
    console.error(`Site with siteId "${siteId}" not found in database`);
    process.exit(1);
  }

  const id = site.id;
  console.log(`Assigning all records to site "${site.name}" (${siteId} / ${id})`);

  // 1. PlatformSite — link every platform to this site
  const platforms = await prisma.platform.findMany({ select: { id: true } });
  let created = 0;
  for (const p of platforms) {
    const exists = await prisma.platformSite.findUnique({
      where: { platformId_siteId: { platformId: p.id, siteId: id } },
    });
    if (!exists) {
      await prisma.platformSite.create({ data: { platformId: p.id, siteId: id } });
      created++;
    }
  }
  console.log(`  PlatformSite: ${created} created (${platforms.length} platforms total)`);

  // 2. CategorySite — link every category to this site
  const categories = await prisma.category.findMany({ select: { id: true } });
  created = 0;
  for (const c of categories) {
    const exists = await prisma.categorySite.findUnique({
      where: { categoryId_siteId: { categoryId: c.id, siteId: id } },
    });
    if (!exists) {
      await prisma.categorySite.create({ data: { categoryId: c.id, siteId: id } });
      created++;
    }
  }
  console.log(`  CategorySite: ${created} created (${categories.length} categories total)`);

  // 3. Articles — set siteId where null
  const articleResult = await prisma.article.updateMany({
    where: { siteId: null },
    data: { siteId: id },
  });
  console.log(`  Articles: ${articleResult.count} updated`);

  // 4. ContactMessages — set siteId where null
  const msgResult = await prisma.contactMessage.updateMany({
    where: { siteId: null },
    data: { siteId: id },
  });
  console.log(`  ContactMessages: ${msgResult.count} updated`);

  // 5. ContentRequests — set siteId where null
  const reqResult = await prisma.contentRequest.updateMany({
    where: { siteId: null },
    data: { siteId: id },
  });
  console.log(`  ContentRequests: ${reqResult.count} updated`);

  // 6. AuditLogs — set siteId where null
  const auditResult = await prisma.auditLog.updateMany({
    where: { siteId: null },
    data: { siteId: id },
  });
  console.log(`  AuditLogs: ${auditResult.count} updated`);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
