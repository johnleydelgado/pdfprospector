# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PDFProspector is a PDF document extraction tool that parses unstructured agricultural/environmental reports and extracts key information with high accuracy. The tool leverages LLM models to understand document context and extract meaningful data regardless of formatting variations.

## Recommended Tech Stack

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js, D3.js, or Recharts
- **File Upload**: react-dropzone
- **Build Tool**: Vite or Create React App

### Backend
- **Runtime**: Node.js
- **PDF Processing**: pdf-parse, pdf2pic
- **LLM Integration**: OpenAI GPT-4 or Anthropic Claude
- **API Framework**: Express.js or Fastify
- **Environment**: Serverless functions (Netlify/Vercel) or full-stack (Railway/Render)

## Core Architecture

### Data Structure
The tool extracts and categorizes data into this TypeScript interface:
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

### Processing Pipeline
1. **PDF Upload**: Drag-and-drop interface accepting large PDFs (100MB+)
2. **Text Extraction**: Extract text while preserving document structure
3. **Context-Aware Parsing**: Distinguish between main content, sub-bullets, examples, and administrative text
4. **LLM Processing**: Use AI to categorize and extract structured data
5. **Data Validation**: Ensure accuracy requirements are met
6. **Dashboard Display**: Present results with charts and summaries
7. **Export Functionality**: Allow data export in various formats

## Accuracy Requirements
- ≥75% accuracy in identifying main goals, BMPs and activities
- ≥75% accuracy in extracting quantitative metrics
- Zero false positives for exact copied content
- Proper categorization of different content types

## Development Commands

### Frontend (React + TypeScript)
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm test
```

### Backend (Node.js)
```bash
# Install dependencies
npm install

# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Testing
npm test

# Linting
npm run lint
```

## Environment Variables
```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
NODE_ENV=production
```

## Testing Data Source
Use Mississippi Watershed Plans for testing format variations:
https://www.mdeq.ms.gov/wp-content/uploads/SurfaceWaterBasinMgtNonPointSourceBranch/Watershed_Plans/MS_Watershed_Plans.htm

## Deployment Considerations

### File Upload Handling
- Handle large PDF files (100MB+) efficiently
- Use temporary storage for serverless deployments
- Implement proper error handling for failed uploads

### Performance
- Optimize PDF processing pipeline
- Implement loading states for long-running operations
- Consider chunked processing for very large documents

### Security
- Validate uploaded files are actual PDFs
- Sanitize extracted text before LLM processing
- Never commit API keys to repository

## Code Quality Standards
- Use TypeScript for type safety
- Implement proper error handling and validation
- Write clean, maintainable code with clear comments
- Follow React best practices (hooks, component composition)
- Use semantic commit messages

## Required Documentation Files
- **README.md**: Implementation approach and setup instructions
- **EXTRACTION_LOGIC.md**: Detailed explanation of extraction methodology
- **TESTING.md**: Accuracy validation approach
- **DEPLOYMENT.md**: Live demo configuration details