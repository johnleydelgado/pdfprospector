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
router.post(
  "/",
  upload.single("pdf"),
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    if (!req.file) {
      throw createError("No PDF file provided", 400);
    }

    const { originalname, buffer, size } = req.file;

    console.log(`📤 Received upload: ${originalname} (${size} bytes)`);

    // Validate file
    if (!pdfProcessor.validatePDF(buffer)) {
      throw createError("Invalid PDF file format", 400);
    }

    try {
      // Step 1: Extract text from PDF
      console.log("🔄 Step 1: Extracting text from PDF...");
      const processingRequest: ProcessingRequest = {
        fileName: originalname,
        fileSize: size,
        buffer,
      };

      const pdfContent = await pdfProcessor.extractText(processingRequest);

      // Step 2: Extract structured data using LLM
      // Initialize LLM service lazily (after env is loaded)
      if (!llmService) {
        llmService = new LLMService();
      }

      const provider = req.body?.model === "anthropic" ? "anthropic" : "openai";
      console.log(
        `🔄 Step 2: Extracting structured data with AI provider=${provider}`
      );

      const extractedReport = await llmService.extractData(
        pdfContent,
        originalname,
        size,
        {
          model: req.body.model || undefined, // Allow frontend to specify model
          temperature: 0.1, // Low temperature for consistent extraction
        }
      );

      const totalTime = Date.now() - startTime;

      // Update processing time in response
      extractedReport.summary.processingTime = totalTime;

      console.log(`✅ Extraction completed successfully in ${totalTime}ms`);
      console.log(
        `📊 Extracted: ${extractedReport.summary.totalGoals} goals, ${extractedReport.summary.totalBMPs} BMPs`
      );

      res.json(extractedReport);
    } catch (error) {
      console.error("❌ Extraction failed:", error);

      // Clean up any temporary files if needed
      // (multer memoryStorage doesn't create files, but good practice)

      throw error;
    }
  })
);

;

export default router;
