import { Router, Request, Response } from "express";
import multer from "multer";

import { asyncHandler, createError } from "../middleware/errorHandler";
import { PDFProcessor } from "../services/pdfProcessor";
import { LLMService } from "../services/llmService";
import { ProcessingRequest } from "../types/report";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "104857600"), // 100MB default
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(createError("Only PDF files are allowed", 400));
      return;
    }
    cb(null, true);
  },
});

const pdfProcessor = new PDFProcessor();
let llmService: LLMService;

// POST /api/extract - Process PDF and extract data
// This is the main endpoint that handles the entire PDF extraction pipeline
router.post(
  "/",
  upload.single("pdf"),
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    // Step 0: Validate that a file was uploaded
    if (!req.file) {
      throw createError("No PDF file provided", 400);
    }

    const { originalname, buffer, size } = req.file;

    console.log(`📤 Received upload: ${originalname} (${size} bytes)`);

    // Step 0.1: Validate the uploaded file is a valid PDF
    // This prevents processing of corrupted or non-PDF files
    if (!pdfProcessor.validatePDF(buffer)) {
      throw createError("Invalid PDF file format", 400);
    }

    try {
      // Step 1: Extract raw text content from PDF
      // Uses pdf-parse library to convert PDF pages into structured text
      // while preserving document layout and formatting cues
      console.log("🔄 Step 1: Extracting text from PDF...");
      const processingRequest: ProcessingRequest = {
        fileName: originalname,
        fileSize: size,
        buffer,
      };

      const pdfContent = await pdfProcessor.extractText(processingRequest);

      // Step 2: Initialize LLM service for intelligent data extraction
      // Service supports both OpenAI and Anthropic models for redundancy
      // Lazy initialization ensures environment variables are loaded
      if (!llmService) {
        llmService = new LLMService();
      }

      // Step 2.1: Select AI provider based on request or default to OpenAI
      // Frontend can specify preferred model for different document types
      const provider = req.body?.model === "anthropic" ? "anthropic" : "openai";
      console.log(
        `🔄 Step 2: Extracting structured data with AI provider=${provider}`
      );

      // Step 2.2: Process text through LLM to extract structured data
      // Low temperature (0.1) ensures consistent, deterministic output
      // LLM categorizes content into goals, BMPs, implementation activities, etc.
      const extractedReport = await llmService.extractData(
        pdfContent,
        originalname,
        size,
        {
          model: req.body.model || undefined, // Allow frontend to specify model
          temperature: 0.1, // Low temperature for consistent extraction
          allowFallback: false, // Disable Anthropic fallback due to credit issue
        }
      );

      const totalTime = Date.now() - startTime;

      // Step 3: Add processing metadata to the response
      // Includes timing information for performance monitoring
      extractedReport.summary.processingTime = totalTime;

      console.log(`✅ Extraction completed successfully in ${totalTime}ms`);
      console.log(
        `📊 Extracted: ${extractedReport.summary.totalGoals} goals, ${extractedReport.summary.totalBMPs} BMPs`
      );

      // Step 4: Return structured data to frontend
      res.json(extractedReport);
    } catch (error) {
      console.error("❌ Extraction failed:", error);

      // Clean up any temporary files if needed
      // (multer memoryStorage doesn't create files, but good practice)

      throw error;
    }
  })
);

export default router;
