import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { ExtractedReport } from "../types/report";
import { PDFContent } from "./pdfProcessor";
import { createError } from "../middleware/errorHandler";
import { v4 as uuidv4 } from "uuid";

type Provider = "openai" | "anthropic";

/**
 * Configuration options for LLM extraction process
 * Allows customization of AI model behavior and fallback strategies
 */
export interface ExtractionOptions {
  // Preferred provider to try first; service will fall back to the other if allowed and available.
  model?: Provider;
  temperature?: number;
  maxTokens?: number;
  // Allow automatic fallback to the other provider if the first one fails (default: true)
  allowFallback?: boolean;
}

export class LLMService {
  private openai?: OpenAI;
  private anthropic?: Anthropic;

  // Allow overriding default models via env
  private OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  private ANTHROPIC_MODEL =
    process.env.ANTHROPIC_MODEL?.trim() || "claude-3-haiku-20240307";

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    if (!this.openai && !this.anthropic) {
      throw new Error("No LLM API keys provided");
    }
  }

  async extractData(
    content: PDFContent,
    fileName: string,
    fileSize: number,
    options: ExtractionOptions = {}
  ): Promise<ExtractedReport> {
    const startTime = Date.now();
    const allowFallback = options.allowFallback ?? true;

    const prompt = this.buildExtractionPrompt(content.text);

    // Build ordered list of providers to try
    const providers = this.planProviders(options.model, allowFallback);

    const errors: string[] = [];
    for (const provider of providers) {
      try {
        console.log(`🤖 Starting LLM extraction using ${provider}...`);
        const extractedData =
          provider === "openai"
            ? await this.extractWithOpenAI(prompt, options)
            : await this.extractWithAnthropic(prompt, options);

        const processingTime = Date.now() - startTime;
        const report = this.structureResponse(
          extractedData,
          fileName,
          fileSize,
          processingTime,
          provider
        );
        console.log(
          `✅ ${provider} extraction completed in ${processingTime}ms`
        );
        return report;
      } catch (err: any) {
        const pretty =
          this.prettyError(err) || err?.toString() || "unknown error";
        errors.push(`${provider}: ${pretty}`);
        console.warn(`⚠️ ${provider} failed: ${pretty}`);
        // If fallback not allowed, or no more providers to try, break out
        // (loop will end naturally and throw combined error)
      }
    }

    // If we got here, all providers failed
    const reason = errors.join(" | ");
    console.error("❌ LLM extraction failed for all providers:", reason);
    throw createError(`Failed to extract data using AI (${reason})`, 502);
  }

  private planProviders(
    preferred?: Provider,
    allowFallback = true
  ): Provider[] {
    const haveOpenAI = Boolean(this.openai);
    const haveAnthropic = Boolean(this.anthropic);

    // Only one available
    if (haveOpenAI && !haveAnthropic) return ["openai"];
    if (!haveOpenAI && haveAnthropic) return ["anthropic"];

    // Both available
    const primary: Provider = preferred ?? "openai"; // default to openai first
    const secondary: Provider = primary === "openai" ? "anthropic" : "openai";
    return allowFallback ? [primary, secondary] : [primary];
  }

  private async extractWithOpenAI(
    prompt: string,
    options: ExtractionOptions
  ): Promise<any> {
    if (!this.openai) throw createError("OpenAI not configured", 500);

    const response = await this.openai.chat.completions.create({
      model: this.OPENAI_MODEL, // default: gpt-4o-mini
      messages: [
        {
          role: "system",
          content:
            "You are an expert at extracting structured data from agricultural and environmental reports. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 3000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw createError("No response from OpenAI", 502);

    return JSON.parse(content);
  }

  private async extractWithAnthropic(
    prompt: string,
    options: ExtractionOptions
  ): Promise<any> {
    if (!this.anthropic) throw createError("Anthropic not configured", 500);

    const response = await this.anthropic.messages.create({
      model: this.ANTHROPIC_MODEL, // default: claude-3-haiku-20240307
      max_tokens: options.maxTokens ?? 3000,
      temperature: options.temperature ?? 0.1,
      messages: [{ role: "user", content: prompt }],
    });

    const piece = response.content[0];
    if (!piece || piece.type !== "text") {
      throw createError("Invalid response type from Anthropic", 502);
    }

    const jsonMatch = piece.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
      throw createError("No valid JSON found in Anthropic response", 502);
    return JSON.parse(jsonMatch[0]);
  }

  private buildExtractionPrompt(text: string): string {
    return `
Extract structured data from this agricultural/environmental report text. Focus on identifying:

1. Goals and objectives
2. Best Management Practices (BMPs) 
3. Implementation activities
4. Monitoring metrics
5. Outreach activities
6. Geographic areas

Return a JSON object with this exact structure:

{
  "goals": [
    {
      "id": "unique_id",
      "title": "goal title",
      "description": "detailed description",
      "targetDate": "YYYY-MM-DD or null",
      "status": "planned|in-progress|completed",
      "priority": "low|medium|high"
    }
  ],
  "bmps": [
    {
      "id": "unique_id", 
      "name": "BMP name",
      "description": "detailed description",
      "category": "category name",
      "implementationCost": number_or_null,
      "maintenanceCost": number_or_null,
      "effectiveness": number_percentage,
      "applicableAreas": ["area1", "area2"]
    }
  ],
  "implementation": [
    {
      "id": "unique_id",
      "name": "activity name",
      "description": "detailed description", 
      "startDate": "YYYY-MM-DD or null",
      "endDate": "YYYY-MM-DD or null",
      "budget": number_or_null,
      "responsible": "responsible party",
      "status": "planned|ongoing|completed",
      "relatedGoals": ["goal_id1"],
      "relatedBMPs": ["bmp_id1"]
    }
  ],
  "monitoring": [
    {
      "id": "unique_id",
      "name": "metric name",
      "description": "detailed description",
      "unit": "measurement unit",
      "targetValue": number_or_null,
      "currentValue": number_or_null,
      "frequency": "frequency description",
      "methodology": "measurement methodology",
      "responsibleParty": "responsible party"
    }
  ],
  "outreach": [
    {
      "id": "unique_id",
      "name": "activity name",
      "description": "detailed description",
      "targetAudience": "target audience",
      "method": "outreach method",
      "timeline": "timeline description",
      "expectedOutcome": "expected outcome",
      "budget": number_or_null
    }
  ],
  "geographicAreas": [
    {
      "id": "unique_id",
      "name": "area name",
      "type": "watershed|county|region|state",
      "area": number_in_acres_or_square_miles,
      "coordinates": {"lat": number, "lng": number} or null,
      "characteristics": ["characteristic1", "characteristic2"]
    }
  ]
}

Document text:
${text.substring(0, 15000)} ${text.length > 15000 ? "...[truncated]" : ""}

Important: 
- Extract only information that is explicitly mentioned in the text
- Use realistic effectiveness percentages (0-100)
- Generate unique IDs for each item
- If no data is found for a category, return an empty array
- Be precise with numbers and dates
- Focus on accuracy over quantity
`;
  }

  private structureResponse(
    extractedData: any,
    fileName: string,
    fileSize: number,
    processingTime: number,
    providerUsed: Provider
  ): ExtractedReport {
    const goals = extractedData.goals || [];
    const bmps = extractedData.bmps || [];
    const implementation = extractedData.implementation || [];
    const monitoring = extractedData.monitoring || [];
    const outreach = extractedData.outreach || [];
    const geographicAreas = extractedData.geographicAreas || [];

    goals.forEach((g: any) => {
      if (!g.id) g.id = uuidv4();
    });
    bmps.forEach((b: any) => {
      if (!b.id) b.id = uuidv4();
    });
    implementation.forEach((i: any) => {
      if (!i.id) i.id = uuidv4();
    });
    monitoring.forEach((m: any) => {
      if (!m.id) m.id = uuidv4();
    });
    outreach.forEach((o: any) => {
      if (!o.id) o.id = uuidv4();
    });
    geographicAreas.forEach((a: any) => {
      if (!a.id) a.id = uuidv4();
    });

    const completedGoals = goals.filter(
      (g: any) => g.status === "completed"
    ).length;
    const completionRate =
      goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

    return {
      summary: {
        totalGoals: goals.length,
        totalBMPs: bmps.length,
        completionRate: Math.round(completionRate),
        extractionAccuracy: 85,
        processingTime,
      },
      goals,
      bmps,
      implementation,
      monitoring,
      outreach,
      geographicAreas,
      metadata: {
        fileName,
        fileSize,
        extractedAt: new Date().toISOString(),
        processingMethod:
          providerUsed === "openai"
            ? `OpenAI ${this.OPENAI_MODEL}`
            : `Anthropic ${this.ANTHROPIC_MODEL}`,
      },
    };
  }

  private prettyError(err: any): string {
    // OpenAI typical shapes
    const oe = err?.error ?? err;
    const openaiMsg =
      oe?.message ||
      oe?.response?.data?.error?.message ||
      oe?.response?.data?.message ||
      oe?.response?.statusText;

    // Anthropic typical shapes
    const ae = err?.message || err?.error?.message;

    return (openaiMsg || ae || "").toString();
  }
}
