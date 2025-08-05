# PDFProspector - Code Walkthrough & Process Flow

This document provides a step-by-step explanation of how the PDFProspector application works, from PDF upload to data visualization.

## Overview

PDFProspector is a full-stack application that extracts structured data from agricultural/environmental PDF reports using AI. The application consists of a React frontend and Node.js backend with TypeScript throughout.

## Architecture Flow

```
PDF Upload → Text Extraction → AI Processing → Data Visualization → Export
```

## Backend Process Flow

### 1. PDF Upload Handling (`apps/backend/src/routes/extract.ts`)

**Entry Point:** `POST /api/extract`

```typescript
// Step 1: File Upload Configuration
const upload = multer({
  storage: multer.memoryStorage(),  // Store in memory for processing
  limits: { fileSize: 100MB },      // Prevent oversized uploads
  fileFilter: (_req, file, cb) => { // Only accept PDFs
    if (file.mimetype !== "application/pdf") {
      cb(createError("Only PDF files are allowed", 400));
      return;
    }
    cb(null, true);
  },
});
```

**What happens:**
- User uploads PDF through frontend
- Multer middleware validates file type and size
- File is stored in memory buffer for processing

### 2. PDF Text Extraction (`apps/backend/src/services/pdfProcessor.ts`)

```typescript
// Step 2: Extract raw text from PDF
const pdfContent = await pdfProcessor.extractText(processingRequest);
```

**What happens:**
- Uses `pdf-parse` library to extract text from PDF buffer
- Preserves document structure and formatting
- Returns extracted text content for AI processing

### 3. AI-Powered Data Extraction (`apps/backend/src/services/llmService.ts`)

```typescript
// Step 3: Convert unstructured text to structured data
const extractedReport = await llmService.extractData(
  pdfContent,
  originalname,
  size,
  {
    model: req.body.model || undefined,
    temperature: 0.1, // Low temperature for consistent extraction
  }
);
```

**What happens:**
- Sends extracted text to OpenAI/Anthropic API
- Uses specific prompts to identify goals, BMPs, activities, etc.
- Returns structured data matching `ExtractedReport` interface
- Low temperature ensures consistent, accurate extraction

### 4. Data Structure (`apps/backend/src/types/report.ts`)

The extracted data follows this TypeScript interface:

```typescript
interface ExtractedReport {
  summary: {
    totalGoals: number;
    totalBMPs: number;
    completionRate: number;
  };
  goals: Goal[];
  bmps: BMP[];
  implementation: ImplementationActivity[];
  monitoring: MonitoringMetric[];
  outreach: OutreachActivity[];
  geographicAreas: GeographicArea[];
}
```

## Frontend Process Flow

### 1. File Upload Component (`apps/frontend/src/components/PDFUpload.tsx`)

**What happens:**
- Drag-and-drop interface for PDF files
- Real-time upload progress tracking
- Sends file to backend `/api/extract` endpoint
- Handles loading states and error messages

### 2. Data Dashboard (`apps/frontend/src/components/Dashboard.tsx`)

**What happens:**
- Receives structured data from backend
- Coordinates display of all visualization components
- Manages overall application state

### 3. Data Visualization Components

#### Summary Cards (`apps/frontend/src/components/SummaryCards.tsx`)
- Displays high-level metrics (total goals, BMPs, completion rate)
- Shows key performance indicators at a glance

#### Charts (`apps/frontend/src/components/Charts.tsx`)
- **Goal Status Distribution**: Pie chart showing status breakdown
- **BMP Effectiveness**: Bar chart of top-performing practices
- **Implementation Status**: Bar chart of activity progress
- **Activity Timeline**: Line chart showing progress over time

#### Data Tables (`apps/frontend/src/components/DataTable.tsx`)
- Detailed tabular view of extracted data
- Sortable and filterable display
- Allows users to verify extraction accuracy

### 4. Export Functionality (`apps/frontend/src/components/ExportButton.tsx`)

**What happens:**
- Sends extracted data to backend `/api/export` endpoint
- Supports JSON, CSV, and Excel formats
- Triggers file download with appropriate headers

## Key Features

### Error Handling (`apps/backend/src/middleware/errorHandler.ts`)
- Centralized error handling with proper HTTP status codes
- Development vs production error responses
- Async error catching for all route handlers

### Validation (`apps/backend/src/middleware/validation.ts`)
- File type and size validation
- Request body schema validation using Joi
- Security checks (PDF magic number, encryption detection)

### Export Service (`apps/backend/src/services/exportService.ts`)
- Converts structured data to multiple formats
- Handles proper file headers and MIME types
- Optimized for large datasets

## Data Flow Summary

1. **Upload**: User drags PDF → Frontend uploads to `/api/extract`
2. **Extract**: Backend extracts text using `pdf-parse`
3. **Process**: AI service converts text → structured data
4. **Display**: Frontend renders charts, tables, and summaries
5. **Export**: User can download data in JSON/CSV/Excel formats

## Security & Validation

- **File Validation**: PDF magic number checking, size limits
- **Type Safety**: Full TypeScript coverage with proper type annotations
- **Error Handling**: Graceful failure with user-friendly messages
- **Rate Limiting**: Prevents abuse of expensive AI operations

## Performance Considerations

- **Memory Storage**: Files processed in memory (no disk I/O)
- **Lazy Loading**: LLM service initialized only when needed
- **Optimized Charts**: Limited data points for large datasets
- **Progress Tracking**: Real-time feedback during processing

This architecture ensures reliable, accurate extraction of agricultural/environmental report data while maintaining good user experience and system performance.