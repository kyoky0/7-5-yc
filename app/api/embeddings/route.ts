import { NextResponse } from "next/server";
import OpenAI from "openai";
import { COMPANIES } from "@/lib/secrets";

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function GET() {
  const client = getClient();
  if (!client) {
    return NextResponse.json({ error: "No API key" }, { status: 500 });
  }

  const start = Date.now();
  const texts = COMPANIES.map((c) =>
    `${c.name}: ${c.capabilityTags.join(", ")}. Needs: ${c.needTags.join(", ")}`
  );

  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
    dimensions: 256,
  });

  const vectors = res.data.map((d) => d.embedding);
  const ids = COMPANIES.map((c) => c.id);
  const names = COMPANIES.map((c) => c.name);

  const matrix: Record<string, Record<string, number>> = {};
  for (let i = 0; i < ids.length; i++) {
    matrix[ids[i]] = {};
    for (let j = 0; j < ids.length; j++) {
      matrix[ids[i]][ids[j]] = Math.round(cosineSimilarity(vectors[i], vectors[j]) * 1000) / 1000;
    }
  }

  return NextResponse.json({
    matrix,
    ids,
    names,
    model: "text-embedding-3-small",
    dimensions: 256,
    tokensUsed: res.usage.total_tokens,
    latencyMs: Date.now() - start,
  });
}
