import { extractStructuredData } from '../lib/llm.js';

export default async function companiesRoutes(fastify) {
  const { prisma } = fastify;

  fastify.post('/api/companies', async (request, reply) => {
    const { name, country, rawInput } = request.body;

    if (!name || !country || !rawInput) {
      return reply.status(400).send({ error: 'name, country, and rawInput are required' });
    }

    const { data: extracted, source } = await extractStructuredData(rawInput);

    const company = await prisma.company.create({
      data: {
        name,
        country,
        rawInput,
        extracted: JSON.stringify(extracted),
        encrypted: '',
      },
    });

    return {
      id: company.id,
      name: company.name,
      country: company.country,
      extracted,
      llmSource: source,
      message: `Registered. Extracted ${extracted.capabilities?.length || 0} capabilities, ${extracted.needs?.length || 0} needs.`,
    };
  });

  fastify.get('/api/companies', async () => {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        country: true,
        extracted: true,
        createdAt: true,
      },
    });
    return companies.map(c => ({
      ...c,
      extracted: JSON.parse(c.extracted),
    }));
  });

  fastify.get('/api/companies/:id', async (request, reply) => {
    const company = await prisma.company.findUnique({
      where: { id: request.params.id },
    });
    if (!company) return reply.status(404).send({ error: 'Not found' });
    return {
      ...company,
      extracted: JSON.parse(company.extracted),
    };
  });

  fastify.delete('/api/companies/:id', async (request) => {
    await prisma.match.deleteMany({
      where: {
        OR: [
          { companyAId: request.params.id },
          { companyBId: request.params.id },
        ],
      },
    });
    await prisma.company.delete({ where: { id: request.params.id } });
    return { ok: true };
  });
}
