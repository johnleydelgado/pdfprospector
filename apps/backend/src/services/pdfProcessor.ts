import pdfParse from "pdf-parse";
import { ProcessingRequest } from "../types/report";
import { createError } from "../middleware/errorHandler";

export interface PDFContent {
  text: string;
  pageTexts: string[];
  pages: number;
  info: any;
  metadata: any;
}

export class PDFProcessor {
  /**
   * Main text extraction method that converts PDF buffer to structured text
   * Handles PDF parsing, validation, and text cleaning for LLM processing
   */
  async extractText(request: ProcessingRequest): Promise<PDFContent> {
    try {
      console.log(
        `📄 Processing PDF: ${request.fileName} (${request.fileSize} bytes)`
      );

      // Parse PDF using pdf-parse library with optimized settings
      const data = await pdfParse(request.buffer, {
        // PDF parsing options for better text extraction
        max: 0, // No page limit - process entire document
        version: "v1.10.100", // Use specific PDF.js version for consistency
      });

      // Validate extracted content
      if (!data.text || data.text.trim().length === 0) {
        throw createError(
          "PDF appears to be empty or contains no extractable text",
          400
        );
      }

      // Extract individual page texts by parsing page by page
      const pageTexts = await this.extractPageTexts(request.buffer, data.numpages);
      
      // Create combined text with page markers
      const combinedText = this.combineWithPageMarkers(pageTexts);

      const content: PDFContent = {
        text: combinedText,
        pageTexts: pageTexts,
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata,
      };

      console.log(
        `✅ PDF processed successfully: ${content.pages} pages, ${content.text.length} characters, ${pageTexts.length} page texts`
      );

      return content;
    } catch (error) {
      console.error("❌ PDF processing failed:", error);

      if (error instanceof Error) {
        if (error.message.includes("Invalid PDF")) {
          throw createError("Invalid PDF file format", 400);
        }
        if (error.message.includes("Password")) {
          throw createError("Password-protected PDFs are not supported", 400);
        }
        if (error.message.includes("Corrupt")) {
          throw createError("PDF file appears to be corrupted", 400);
        }
      }

      throw createError("Failed to process PDF file", 500);
    }
  }



  private async extractPageTexts(buffer: Buffer, numPages: number): Promise<string[]> {
    console.log(`📄 Extracting ${numPages} pages using reliable fallback method`);
    
    // Use the reliable fallback method that actually works
    return this.fallbackPageExtraction(buffer, numPages);
  }

  private async fallbackPageExtraction(buffer: Buffer, numPages: number): Promise<string[]> {
    const data = await pdfParse(buffer, { max: 0, version: "v1.10.100" });
    
    console.log(`📊 Raw PDF text length: ${data.text?.length || 0} characters`);
    console.log(`📄 First 200 chars of raw text:`, data.text?.substring(0, 200));
    
    if (!data.text || data.text.trim().length === 0) {
      console.warn("⚠️ No text extracted from PDF");
      return [];
    }
    
    // Apply minimal cleaning to preserve structure but fix hyphenation
    const cleanedText = data.text
      // Fix basic hyphenation issues
      .replace(/(\w+)-\n+(\w+)/g, '$1$2')
      .replace(/water-\s*\n+\s*shed/gi, 'watershed')
      .replace(/non-\s*\n+\s*point/gi, 'nonpoint')
      // Preserve structure but normalize excessive whitespace
      .replace(/\n{4,}/g, '\n\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
    
    console.log(`🧹 Cleaned text length: ${cleanedText.length} characters`);
    
    if (numPages <= 1) {
      return [this.cleanPageText(cleanedText, 1)];
    }
    
    // Estimate page boundaries more intelligently
    const avgPageLength = Math.floor(cleanedText.length / numPages);
    const pageTexts: string[] = [];
    
    let start = 0;
    for (let i = 0; i < numPages; i++) {
      let end = start + avgPageLength;
      
      // Try to break at reasonable boundaries
      if (i < numPages - 1) {
        // Look for paragraph breaks
        const nextDoubleNewline = cleanedText.indexOf('\n\n', end);
        const prevDoubleNewline = cleanedText.lastIndexOf('\n\n', end);
        
        // Look for single newlines if no paragraph breaks
        const nextNewline = cleanedText.indexOf('\n', end);
        const prevNewline = cleanedText.lastIndexOf('\n', end);
        
        if (nextDoubleNewline !== -1 && nextDoubleNewline - end < avgPageLength * 0.4) {
          end = nextDoubleNewline;
        } else if (prevDoubleNewline !== -1 && end - prevDoubleNewline < avgPageLength * 0.4) {
          end = prevDoubleNewline;
        } else if (nextNewline !== -1 && nextNewline - end < avgPageLength * 0.3) {
          end = nextNewline;
        } else if (prevNewline !== -1 && end - prevNewline < avgPageLength * 0.3) {
          end = prevNewline;
        }
      } else {
        end = cleanedText.length;
      }
      
      const pageText = cleanedText.substring(start, end).trim();
      console.log(`📑 Page ${i + 1}: ${pageText.length} characters`);
      
      if (pageText) {
        const finalPageText = this.cleanPageText(pageText, i + 1);
        pageTexts.push(finalPageText);
        console.log(`✅ Final page ${i + 1}: ${finalPageText.length} characters`);
      }
      start = end;
    }
    
    console.log(`📚 Total pages extracted: ${pageTexts.length}`);
    return pageTexts;
  }

  private cleanPageText(text: string, pageNum: number): string {
    // Don't apply aggressive cleanText again, just remove headers/footers
    let cleaned = this.removeHeadersFooters(text, pageNum);
    
    // Apply minimal additional cleaning
    cleaned = cleaned
      .replace(/\n{4,}/g, '\n\n\n') // Limit excessive newlines
      .trim();
    
    return cleaned;
  }

  private removeHeadersFooters(text: string, _pageNum: number): string {
    const lines = text.split('\n');
    if (lines.length < 5) return text;

    // Common header/footer patterns
    const patterns = [
      /^\s*page\s+\d+\s*$/i,
      /^\s*\d+\s*$/,
      /^\s*draft\s*$/i,
      /^\s*final\s*$/i,
      /^\s*watershed\s+(plan|management|strategy)\s*$/i,
      /^\s*\d{4}\s*$/,
      /^\s*chapter\s+\d+\s*$/i,
      /^\s*section\s+\d+\s*$/i
    ];

    const filteredLines = lines.filter((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      
      const isHeaderFooter = patterns.some(pattern => pattern.test(trimmed));
      
      // Remove if header/footer pattern in first/last few lines
      if (isHeaderFooter && (index < 3 || index >= lines.length - 3)) {
        return false;
      }
      
      return true;
    });

    return filteredLines.join('\n');
  }

  private combineWithPageMarkers(pageTexts: string[]): string {
    return pageTexts
      .map((text, index) => {
        const pageMarker = `=== PAGE ${index + 1} ===`;
        return pageMarker + '\n' + text;
      })
      .join('\n\n');
  }

  validatePDF(buffer: Buffer): boolean {
    // Check PDF magic number (starts with %PDF-)
    const pdfSignature = buffer.slice(0, 5).toString();
    return pdfSignature === "%PDF-";
  }

  extractMetadata(content: PDFContent): Record<string, any> {
    return {
      pages: content.pages,
      textLength: content.text.length,
      pageTexts: content.pageTexts.length,
      wordCount: content.text.split(/\s+/).length,
      averagePageLength: Math.round(content.text.length / content.pages),
      hasImages: false, // pdf-parse doesn't extract images by default
      creationDate: content.info?.CreationDate,
      modificationDate: content.info?.ModDate,
      creator: content.info?.Creator,
      producer: content.info?.Producer,
      title: content.info?.Title,
      subject: content.info?.Subject,
      author: content.info?.Author,
    };
  }
}
