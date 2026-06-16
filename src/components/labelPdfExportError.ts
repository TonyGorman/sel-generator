export type LabelPdfExportErrorCode =
  | 'print-pages-missing'
  | 'dependency-load-failed'
  | 'pdf-initialization-failed'
  | 'vector-export-failed'
  | 'raster-fallback-failed';

export class LabelPdfExportError extends Error {
  readonly code: LabelPdfExportErrorCode;
  readonly cause?: unknown;

  constructor(code: LabelPdfExportErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'LabelPdfExportError';
    this.code = code;
    this.cause = cause;
  }
}
