/**
 * PDF Parser Utility
 * Extracts text content from PDF files
 */

import fs from 'fs';
import path from 'pathe';

export interface ParseResult {
  text: string;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
}

export interface ParseOptions {
  /**
   * Maximum number of pages to parse (0 = all pages)
   * @default 0
   */
  maxPages?: number;

  /**
   * Maximum text length per page (0 = no limit)
   * @default 10000
   */
  maxCharsPerPage?: number;

  /**
   * Include metadata in the result
   * @default true
   */
  includeMetadata?: boolean;
}

const DEFAULT_OPTIONS: ParseOptions = {
  maxPages: 0, // Parse all pages
  maxCharsPerPage: 10000,
  includeMetadata: true,
};

/**
 * Parse a PDF file and extract text content
 *
 * @param filePath - Absolute path to the PDF file
 * @param options - Parsing options
 * @returns Parsed PDF content
 */
export async function parsePDF(
  filePath: string,
  options: ParseOptions = {},
): Promise<ParseResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF file not found: ${filePath}`);
  }

  // Get file stats
  const stats = fs.statSync(filePath);
  const fileSizeMB = stats.size / (1024 * 1024);

  // Check file size (warn if > 10MB)
  if (fileSizeMB > 10) {
    console.warn(
      `PDF file is large (${fileSizeMB.toFixed(2)}MB), parsing may take a while`,
    );
  }

  try {
    // Try to use pdf-parse if available
    const pdfParse = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);

    const data = await pdfParse.default(dataBuffer, {
      // Only parse requested pages
      max: opts.maxPages || undefined,
    });

    // Truncate text per page if needed
    let text = data.text;
    if (opts.maxCharsPerPage && opts.maxCharsPerPage > 0) {
      // Split by pages (pdf-parse doesn't give page breaks, so we split by heuristics)
      // This is a simple approach - for better results, use a library that preserves page structure
      text = text
        .split(/\f/) // Form feed character often used as page separator
        .map((pageText: string) => {
          if (pageText.length > opts.maxCharsPerPage!) {
            return pageText.substring(0, opts.maxCharsPerPage) + '... [truncated]';
          }
          return pageText;
        })
        .join('\n\n--- Page Break ---\n\n');
    }

    const result: ParseResult = {
      text: text.trim(),
      pageCount: data.numpages,
    };

    // Add metadata if requested and available
    if (opts.includeMetadata) {
      const metadata: ParseResult['metadata'] = {};

      if (data.info) {
        if (data.info.Title) metadata.title = String(data.info.Title);
        if (data.info.Author) metadata.author = String(data.info.Author);
        if (data.info.Subject) metadata.subject = String(data.info.Subject);
        if (data.info.Keywords) metadata.keywords = String(data.info.Keywords);
        if (data.info.Creator) metadata.creator = String(data.info.Creator);
        if (data.info.Producer) metadata.producer = String(data.info.Producer);
        if (data.info.CreationDate)
          metadata.creationDate = String(data.info.CreationDate);
        if (data.info.ModDate)
          metadata.modificationDate = String(data.info.ModDate);
      }

      if (Object.keys(metadata).length > 0) {
        result.metadata = metadata;
      }
    }

    return result;
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
      // pdf-parse not available, provide helpful error
      throw new Error(
        'PDF parsing requires the "pdf-parse" package. Install it with: npm install pdf-parse',
      );
    }

    throw new Error(
      `Failed to parse PDF file: ${error.message || String(error)}`,
    );
  }
}

/**
 * Check if PDF parsing is available (pdf-parse is installed)
 */
export async function isPDFParsingAvailable(): Promise<boolean> {
  try {
    await import('pdf-parse');
    return true;
  } catch {
    return false;
  }
}

/**
 * Format PDF parse result for LLM consumption
 */
export function formatPDFResult(result: ParseResult): string {
  const sections: string[] = [];

  sections.push(`# PDF Document`);
  sections.push(`Pages: ${result.pageCount}`);

  if (result.metadata) {
    const meta: string[] = [];
    if (result.metadata.title) meta.push(`Title: ${result.metadata.title}`);
    if (result.metadata.author) meta.push(`Author: ${result.metadata.author}`);
    if (result.metadata.subject) meta.push(`Subject: ${result.metadata.subject}`);
    if (result.metadata.creationDate)
      meta.push(`Created: ${result.metadata.creationDate}`);

    if (meta.length > 0) {
      sections.push('\n## Metadata');
      sections.push(meta.join('\n'));
    }
  }

  sections.push('\n## Content');
  sections.push(result.text);

  return sections.join('\n');
}
