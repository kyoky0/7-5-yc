import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const demoCompanies = [
  {
    name: 'NipponCoat Technologies',
    country: 'Japan',
    rawInput: `Our proprietary nano-coating process achieves corrosion resistance rated at ISO 12944 C5-M level. Operating temperature range: -40°C to 200°C. Adhesion strength: 15 MPa on aluminum substrates. Production capacity: 500 units/month, expandable to 2,000. This process is not patented — maintained as a trade secret due to its manufacturing complexity. We also have expertise in thermal-barrier coatings for high-temperature applications up to 400°C. Open to licensing or joint development with international partners.`,
    extracted: JSON.stringify({
      capabilities: [
        'nano-coating-corrosion-resistance',
        'high-temperature-coating',
        'thermal-barrier-coating',
        'aluminum-substrate-bonding',
      ],
      needs: [],
      params: {
        temperature_range: [-40, 200],
        production_scale: 'small',
        cost_per_unit: 150,
        industry: 'materials',
        durability_years: 10,
      },
      summary: 'Japanese materials company with proprietary nano-coating and thermal barrier technologies, maintained as trade secrets.',
    }),
  },
  {
    name: 'KazMineral Processing',
    country: 'Kazakhstan',
    rawInput: `We operate mining and mineral processing equipment in extreme continental climate conditions (-45°C winters, +40°C summers) in central Kazakhstan. Critical unresolved need: corrosion-resistant coating for sensor housings exposed to sulfuric acid vapor in our copper smelting facilities. Current coating solution from a domestic supplier fails after 8 months, causing sensor replacement costs of $12,000 per unit. Requirement: minimum 24-month durability. Budget: up to $200 per sensor housing, approximately 3,000 units per year. We also need thermal management solutions for our processing plant control systems that overheat in summer.`,
    extracted: JSON.stringify({
      capabilities: [
        'rare-earth-mineral-processing',
        'extreme-climate-operations',
        'copper-smelting',
      ],
      needs: [
        'nano-coating-corrosion-resistance',
        'acid-resistant-coating',
        'thermal-management-solution',
        'extreme-cold-coating',
      ],
      params: {
        temperature_range: [-45, 40],
        production_scale: 'medium',
        budget_per_unit: 200,
        industry: 'mining',
        durability_years: 2,
      },
      summary: 'Kazakh mining company needing corrosion-resistant coatings for extreme climate sensor equipment and thermal management.',
    }),
  },
  {
    name: 'ShenZhen EV Components Ltd',
    country: 'China',
    rawInput: `We manufacture lithium-ion battery casings and thermal management systems for electric vehicles. Urgent need: thermal management coating for battery packs operating in range -30°C to 150°C. Must pass UN38.3 and GB/T 31485 safety certification. Production volume: 50,000 units/month. Currently sourcing thermal coatings from a domestic supplier but experiencing 3% defect rate causing $2M monthly losses. We also have proprietary battery cell assembly automation technology and advanced welding techniques for aluminum-to-copper joints that we would consider licensing to international partners.`,
    extracted: JSON.stringify({
      capabilities: [
        'battery-cell-assembly-automation',
        'aluminum-copper-welding',
        'ev-battery-casing-manufacturing',
        'high-volume-manufacturing',
      ],
      needs: [
        'thermal-management-coating',
        'high-temperature-coating',
        'quality-coating-supplier',
      ],
      params: {
        temperature_range: [-30, 150],
        production_scale: 'large',
        budget_per_unit: 50,
        industry: 'ev-automotive',
        durability_years: 8,
      },
      summary: 'Chinese EV components manufacturer needing thermal coatings, with licensable battery automation and welding IP.',
    }),
  },
];

async function seed() {
  console.log('Seeding demo companies...');

  await prisma.match.deleteMany();
  await prisma.company.deleteMany();

  for (const company of demoCompanies) {
    const created = await prisma.company.create({ data: company });
    console.log(`  Created: ${created.name} (${created.country})`);
  }

  console.log('Seed complete. Run POST /api/match to find matches.');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
