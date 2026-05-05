import Anthropic from '@anthropic-ai/sdk';

export interface GeneratedSection {
  name: string;
  content: string;
  style: 'bullet' | 'paragraph';
  verbosity: 'detailed' | 'standard' | 'concise';
}

export interface GeneratedTemplate {
  sections: GeneratedSection[];
}

const SYSTEM_PROMPT = `You are a clinical psychotherapy practice assistant. Your task is to analyze a sample session note and extract a reusable note template structure from it.

Given a sample note, identify the distinct sections (e.g. "Presenting Problem", "Interventions", "Progress", "Plan", etc.) and for each section:
- Extract the section name (clean, professional title)
- Write a brief placeholder/guide for what should go in that section (2-3 sentences max, in second person "Document...", "Note...", "Describe...")
- Determine the style: "bullet" if the content is naturally list-like, "paragraph" if it flows as prose
- Determine verbosity: "detailed" for complex clinical content, "standard" for typical notes, "concise" for brief entries

IMPORTANT: Remove all identifying information from the sample (patient names, dates, specific diagnoses). The output must be a generic reusable template.

Respond ONLY with valid JSON in this exact format:
{
  "sections": [
    {
      "name": "Section Name",
      "content": "Brief guide for what to write here.",
      "style": "bullet" | "paragraph",
      "verbosity": "detailed" | "standard" | "concise"
    }
  ]
}`;

export async function generateTemplateFromNote(
  sampleNote: string,
  templateName: string,
  onChunk?: (text: string) => void
): Promise<GeneratedTemplate> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const userMessage = `Template name: "${templateName}"

Sample note to analyze:
---
${sampleNote}
---

Extract the template structure from this note. Return only JSON.`;

  let fullText = '';

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      fullText += chunk.delta.text;
      onChunk?.(fullText);
    }
  }

  // Extract JSON from the response
  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No valid JSON in AI response');

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedTemplate;
  return parsed;
}
