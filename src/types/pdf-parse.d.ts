declare module 'pdf-parse' {
  interface PDFParseOptions {
    max?: number;
  }

  interface PDFParseData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  interface PDFStatic {
    (buffer: Buffer, options?: PDFParseOptions): Promise<PDFParseData>;
    default: (buffer: Buffer, options?: PDFParseOptions) => Promise<PDFParseData>;
  }

  const pdfParse: PDFStatic;
  export = pdfParse;
}
