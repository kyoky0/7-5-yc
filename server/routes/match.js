import { computePSI, checkCompatibility } from '../lib/psi.js';

export default async function matchRoutes(fastify) {
  const { prisma } = fastify;

  fastify.post('/api/match', async (request) => {
    const companies = await prisma.company.findMany();
    if (companies.length < 2) {
      return { error: 'Need at least 2 companies to match', matches: [] };
    }

    const results = [];

    for (let i = 0; i < companies.length; i++) {
      for (let j = i + 1; j < companies.length; j++) {
        const a = companies[i];
        const b = companies[j];
        const extractedA = JSON.parse(a.extracted);
        const extractedB = JSON.parse(b.extracted);

        const capsA = extractedA.capabilities || [];
        const needsB = extractedB.needs || [];
        const capsB = extractedB.capabilities || [];
        const needsA = extractedA.needs || [];

        // PSI: A's capabilities vs B's needs
        const psi1 = computePSI(capsA, needsB);
        // PSI: B's capabilities vs A's needs
        const psi2 = computePSI(capsB, needsA);

        const totalMatches = psi1.size + psi2.size;
        if (totalMatches === 0) {
          results.push({
            companyA: { id: a.id, name: a.name, country: a.country },
            companyB: { id: b.id, name: b.name, country: b.country },
            intersectionSize: 0,
            direction: 'none',
            psiSteps: psi1.steps,
          });
          continue;
        }

        const compatReport = checkCompatibility(
          extractedA.params || {},
          extractedB.params || {}
        );

        const allMatched = [
          ...psi1.matchedPairs.map(m => ({ capability: m.fromA, need: m.fromB, direction: 'A→B' })),
          ...psi2.matchedPairs.map(m => ({ capability: m.fromA, need: m.fromB, direction: 'B→A' })),
        ];

        const match = await prisma.match.upsert({
          where: {
            id: `${a.id}-${b.id}`,
          },
          create: {
            id: `${a.id}-${b.id}`,
            companyAId: a.id,
            companyBId: b.id,
            intersectionSize: totalMatches,
            matchedCategories: JSON.stringify(allMatched),
            confidence: compatReport.confidence,
            proofHash: psi1.proof,
            compatibilityReport: JSON.stringify(compatReport),
          },
          update: {
            intersectionSize: totalMatches,
            matchedCategories: JSON.stringify(allMatched),
            confidence: compatReport.confidence,
            proofHash: psi1.proof,
            compatibilityReport: JSON.stringify(compatReport),
          },
        });

        results.push({
          matchId: match.id,
          companyA: { id: a.id, name: a.name, country: a.country },
          companyB: { id: b.id, name: b.name, country: b.country },
          intersectionSize: totalMatches,
          confidence: compatReport.confidence,
          proof: psi1.proof,
          psiSteps: psi1.steps,
          disclosureLevel: match.disclosureLevel,
        });
      }
    }

    return {
      totalPairs: results.length,
      matchesFound: results.filter(r => r.intersectionSize > 0).length,
      results,
    };
  });

  fastify.get('/api/matches', async () => {
    const matches = await prisma.match.findMany({
      include: {
        companyA: { select: { id: true, name: true, country: true } },
        companyB: { select: { id: true, name: true, country: true } },
      },
      orderBy: { intersectionSize: 'desc' },
    });
    return matches.map(m => ({
      ...m,
      matchedCategories: JSON.parse(m.matchedCategories),
      compatibilityReport: JSON.parse(m.compatibilityReport),
    }));
  });
}
