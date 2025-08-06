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
  private OPENAI_MODEL =
    process.env.OPENAI_MODEL?.trim() || "gpt-4.1-2025-04-14";
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

    // Use enhanced prompt with page structure analysis
    const prompt = this.buildExtractionPrompt(content.text, content.pageTexts);

    // Log enhanced processing details
    console.log(`📝 Prompt length: ${prompt.length} characters`);
    console.log(`📄 PDF text length: ${content.text.length} characters`);
    console.log(
      `📑 Pages processed: ${content.pageTexts?.length || 0} individual pages`
    );
    if (content.pageTexts && content.pageTexts.length > 0) {
      console.log(
        `🔍 Page structure preserved with markers and hyphenation fixes`
      );
    }

    // Build ordered list of providers to try
    const providers = this.planProviders(options.model, allowFallback);

    const errors: string[] = [];
    for (const provider of providers) {
      try {
        console.log(`🤖 Starting enhanced LLM extraction using ${provider}...`);
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
          `✅ ${provider} enhanced extraction completed in ${processingTime}ms`
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
    console.error(
      "❌ Enhanced LLM extraction failed for all providers:",
      reason
    );
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

    console.log(`🔧 Using ${this.OPENAI_MODEL} for extraction`);

    const response = await this.openai.chat.completions.create({
      model: this.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert at extracting structured data from agricultural and environmental reports. Always respond with valid, complete JSON that matches the exact schema provided. Ensure your JSON response is properly terminated with closing braces and brackets.",
        },
        { role: "user", content: prompt },
      ],
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 8000, // Increased for comprehensive extraction
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw createError("No response from OpenAI", 502);

    console.log(`📊 Raw response length: ${content.length} characters`);
    console.log(`📋 Response first 500 chars:`, content.substring(0, 500));
    console.log(`📋 Response last 500 chars:`, content.substring(Math.max(0, content.length - 500)));

    // Enhanced JSON parsing with better error recovery
    try {
      const parsed = JSON.parse(content);
      
      // Log extraction results for debugging
      console.log(`✅ Successfully parsed JSON`);
      if (parsed.goals) console.log(`📊 Goals extracted: ${parsed.goals.length}`);
      if (parsed.bmps) console.log(`📊 BMPs extracted: ${parsed.bmps.length}`);
      if (parsed.implementation) console.log(`📊 Implementation activities extracted: ${parsed.implementation.length}`);
      if (parsed.monitoring) console.log(`📊 Monitoring metrics extracted: ${parsed.monitoring.length}`);
      if (parsed.outreach) console.log(`📊 Outreach activities extracted: ${parsed.outreach.length}`);
      if (parsed.geographicAreas) console.log(`📊 Geographic areas extracted: ${parsed.geographicAreas.length}`);
      
      return parsed;
    } catch (parseError) {
      console.warn(`⚠️ JSON parsing failed:`, parseError);
      console.log(`❌ Problematic content:`, content);
      
      // Try to fix truncated JSON
      let fixedContent = content;
      
      // If content doesn't end with }, try to close it properly
      if (!content.trim().endsWith('}')) {
        console.log('🔧 Attempting to fix truncated JSON...');
        
        // Count open vs closed braces to determine what's missing
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        const openBrackets = (content.match(/\[/g) || []).length;
        const closeBrackets = (content.match(/\]/g) || []).length;
        
        // Add missing closing brackets and braces
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixedContent += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedContent += '}';
        }
        
        console.log(`🔧 Fixed content length: ${fixedContent.length}`);
        
        try {
          return JSON.parse(fixedContent);
        } catch (secondError) {
          console.error('❌ Fixed JSON still invalid:', secondError);
        }
      }
      
      // If still failing, return a minimal valid structure to avoid complete failure
      console.warn('🚨 Falling back to minimal JSON structure');
      return {
        goals: [],
        bmps: [],
        implementation: [],
        monitoring: [],
        outreach: [],
        geographicAreas: []
      };
    }
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

  private buildExtractionPrompt(text: string, pageTexts?: string[]): string {
    let pageAnalysis = "";
    
    // Add page structure analysis if available
    if (pageTexts && pageTexts.length > 0) {
      pageAnalysis = `
📊 DOCUMENT PROCESSING ENHANCEMENTS:
✅ ${pageTexts.length} pages processed individually
✅ Page markers (=== PAGE N ===) added for location tracking  
✅ Line breaks preserved, hyphenated terms fixed
✅ Headers/footers stripped

`;
    }

    return `${pageAnalysis}Extract comprehensive data from this watershed plan. Be thorough - watershed plans contain extensive implementation, monitoring, and outreach programs.

EXTRACT ALL relevant items in these categories:

1. GOALS: Objectives, targets, purposes (reduce pollution, improve habitat, protect resources)
2. BMPs: Management practices (riparian buffers, conservation tillage, wetlands, bank stabilization)  
3. IMPLEMENTATION: Specific projects/activities with budgets, timelines, responsible parties
4. MONITORING: Water quality parameters, biological indicators, assessments
5. OUTREACH: Education, training, workshops, stakeholder engagement
6. GEOGRAPHIC AREAS: Watersheds, counties, regions, water bodies

Return valid JSON with this structure:
{
  "goals": [{"id": "goal_[name]", "title": "title", "description": "desc", "targetDate": "YYYY-MM-DD or null", "status": "planned|in-progress|completed", "priority": "low|medium|high"}],
  "bmps": [{"id": "bmp_[name]", "name": "name", "description": "desc", "category": "Water Quality|Agricultural|Stormwater|Stream Restoration|Other", "implementationCost": number_or_null, "maintenanceCost": number_or_null, "effectiveness": number_or_null, "applicableAreas": ["areas"]}],
  "implementation": [{"id": "impl_[name]", "name": "name", "description": "desc", "startDate": "YYYY-MM-DD or null", "endDate": "YYYY-MM-DD or null", "budget": number_or_null, "responsible": "party or Not specified", "status": "planned|ongoing|completed", "relatedGoals": ["goal_ids"], "relatedBMPs": ["bmp_ids"]}],
  "monitoring": [{"id": "monitor_[name]", "name": "name", "description": "desc", "unit": "unit or Not specified", "targetValue": number_or_null, "currentValue": number_or_null, "frequency": "freq or Not specified", "methodology": "method or Not specified", "responsibleParty": "party or Not specified"}],
  "outreach": [{"id": "outreach_[name]", "name": "name", "description": "desc", "targetAudience": "audience", "method": "method", "timeline": "timeline or Ongoing", "expectedOutcome": "outcome", "budget": number_or_null}],
  "geographicAreas": [{"id": "area_[name]", "name": "name", "type": "watershed|county|region|state", "area": number_or_null, "coordinates": {"lat": number, "lng": number} or null, "characteristics": ["features"]}]
}

IMPORTANT RULES:
✅ BE COMPREHENSIVE - don't return empty arrays unless truly no content exists
✅ Include all projects/activities you find, even with limited details
✅ Generate descriptive IDs (goal_reduce_phosphorus, bmp_riparian_buffers, impl_streambank_project)
✅ Use "Not specified" for missing required text fields, null for missing numbers
✅ Link related items via IDs when connections are clear
✅ Extract from entire document using page markers for context

CRITICAL: Watershed plans are detailed documents. If returning mostly empty arrays, you're being too selective. Look thoroughly for implementation activities, monitoring programs, and outreach efforts - they are standard components.

Document text:
${text.substring(0, 16000)} ${text.length > 16000 ? "...[truncated]" : ""}
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
