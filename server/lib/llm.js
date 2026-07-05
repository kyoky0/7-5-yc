/**
 * LLM Integration — Ollama (Local) + Claude API (Fallback)
 *
 * Extracts structured capability/need data from raw company text.
 * Local LLM ensures secret documents never leave the machine.
 */

const EXTRACTION_PROMPT = `You are a structured data extractor for company technology documents.
Extract the following from the given text and return ONLY valid JSON:

{
  "capabilities": ["list of specific technologies, processes, or skills this company HAS"],
  "needs": ["list of specific technologies, processes, or skills this company NEEDS from external partners"],
  "params": {
    "temperature_range": [min_celsius, max_celsius] or null,
    "production_scale": "small" | "medium" | "large" or null,
    "budget_per_unit": number_in_usd or null,
    "cost_per_unit": number_in_usd or null,
    "industry": "string",
    "durability_years": number or null
  },
  "summary": "One sentence summary of this company's core offering or need"
}

Rules:
- capabilities: what the company CAN DO or HAS (technologies, patents, processes)
- needs: what the company NEEDS from outside (problems they can't solve alone)
- Use lowercase, hyphenated terms for capabilities/needs (e.g. "nano-coating", "corrosion-resistance")
- Be specific — "coating" is too vague, "nano-coating-corrosion-resistance" is good
- Extract numeric parameters when mentioned
- Return ONLY the JSON object, no other text`;

async function extractWithOllama(rawText) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'gemma4-e4b';

  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: `${EXTRACTION_PROMPT}\n\nDocument:\n${rawText}`,
      format: 'json',
      stream: false,
      options: { temperature: 0.1 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.response);
}

async function extractWithClaude(rawText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `${EXTRACTION_PROMPT}\n\nDocument:\n${rawText}`,
      }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse Claude response as JSON');
  return JSON.parse(jsonMatch[0]);
}

export async function extractStructuredData(rawText) {
  const useLocal = process.env.USE_LOCAL_LLM !== 'false';

  if (useLocal) {
    try {
      return { data: await extractWithOllama(rawText), source: 'local-llm' };
    } catch (err) {
      console.warn('Local LLM failed, falling back to Claude API:', err.message);
    }
  }

  try {
    return { data: await extractWithClaude(rawText), source: 'claude-api' };
  } catch (err) {
    console.error('Claude API also failed:', err.message);
    throw new Error('Both Local LLM and Claude API failed');
  }
}
