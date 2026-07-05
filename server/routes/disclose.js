export default async function discloseRoutes(fastify) {
  const { prisma } = fastify;

  fastify.post('/api/matches/:matchId/opt-in', async (request, reply) => {
    const { matchId } = request.params;
    const { companyId } = request.body;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return reply.status(404).send({ error: 'Match not found' });

    const isA = match.companyAId === companyId;
    const isB = match.companyBId === companyId;
    if (!isA && !isB) return reply.status(403).send({ error: 'Not a party to this match' });

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: isA ? { aOptedIn: true } : { bOptedIn: true },
    });

    const bothOptedIn = updated.aOptedIn && updated.bOptedIn;
    if (bothOptedIn && updated.disclosureLevel < 1) {
      await prisma.match.update({
        where: { id: matchId },
        data: { disclosureLevel: 1 },
      });
    }

    return {
      matchId,
      yourOptIn: true,
      otherOptedIn: bothOptedIn,
      newDisclosureLevel: bothOptedIn ? 1 : 0,
      message: bothOptedIn
        ? 'Both parties opted in. Level 1 details now available.'
        : 'Waiting for the other party to opt in.',
    };
  });

  fastify.post('/api/matches/:matchId/sign-nda', async (request, reply) => {
    const { matchId } = request.params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        companyA: true,
        companyB: true,
      },
    });

    if (!match) return reply.status(404).send({ error: 'Match not found' });
    if (match.disclosureLevel < 1) {
      return reply.status(400).send({ error: 'Both parties must opt-in to Level 1 first' });
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { disclosureLevel: 2 },
    });

    const extractedA = JSON.parse(match.companyA.extracted);
    const extractedB = JSON.parse(match.companyB.extracted);
    const matchedCategories = JSON.parse(match.matchedCategories);

    return {
      matchId,
      disclosureLevel: 2,
      companyA: {
        name: match.companyA.name,
        country: match.companyA.country,
        summary: extractedA.summary,
        relevantCapabilities: matchedCategories
          .filter(m => m.direction === 'A→B')
          .map(m => m.capability),
      },
      companyB: {
        name: match.companyB.name,
        country: match.companyB.country,
        summary: extractedB.summary,
        relevantNeeds: matchedCategories
          .filter(m => m.direction === 'A→B')
          .map(m => m.need),
      },
      compatibilityReport: JSON.parse(match.compatibilityReport),
      nextStep: 'Schedule a call to discuss specific terms.',
    };
  });

  fastify.get('/api/matches/:matchId/disclosure', async (request, reply) => {
    const match = await prisma.match.findUnique({
      where: { id: request.params.matchId },
      include: {
        companyA: { select: { id: true, name: true, country: true, extracted: true } },
        companyB: { select: { id: true, name: true, country: true, extracted: true } },
      },
    });

    if (!match) return reply.status(404).send({ error: 'Match not found' });

    const matchedCategories = JSON.parse(match.matchedCategories);
    const compatReport = JSON.parse(match.compatibilityReport);

    const level0 = {
      intersectionSize: match.intersectionSize,
      confidence: match.confidence,
      proof: match.proofHash,
      message: `${match.intersectionSize} capability-need match(es) found.`,
    };

    if (match.disclosureLevel < 1) {
      return { level: 0, data: level0, aOptedIn: match.aOptedIn, bOptedIn: match.bOptedIn };
    }

    const level1 = {
      ...level0,
      categories: matchedCategories.map(m => m.capability.split('-')[0]),
      compatibilityChecks: compatReport.checks,
      compatibilityScore: compatReport.confidence,
    };

    if (match.disclosureLevel < 2) {
      return {
        level: 1,
        data: level1,
        companyA: { country: match.companyA.country },
        companyB: { country: match.companyB.country },
      };
    }

    const extractedA = JSON.parse(match.companyA.extracted);
    const extractedB = JSON.parse(match.companyB.extracted);

    return {
      level: 2,
      data: {
        ...level1,
        matchedDetails: matchedCategories,
      },
      companyA: {
        name: match.companyA.name,
        country: match.companyA.country,
        summary: extractedA.summary,
      },
      companyB: {
        name: match.companyB.name,
        country: match.companyB.country,
        summary: extractedB.summary,
      },
    };
  });
}
