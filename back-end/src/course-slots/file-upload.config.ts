import { BadRequestException } from '@nestjs/common';
import { diskStorage, Options } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

/** Target directory for storing uploads: back-end/uploads/ */
export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure upload directory exists on startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/** Maximum allowed file size: 5 MB */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Supported MIME types for course syllabi and documents */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

/** Supported file extensions */
export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.csv',
  '.xls',
  '.xlsx',
  '.jpg',
  '.jpeg',
  '.png',
];

/**
 * Generates a collision-resistant, sanitized safe filename.
 * Removes directory traversals and special characters, appending timestamp and random suffix.
 */
export function editFileName(
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
) {
  const ext = path.extname(file.originalname).toLowerCase();
  const rawBase = path.basename(file.originalname, ext);
  const sanitizedBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50) || 'file';
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const safeFilename = `${sanitizedBase}-${uniqueSuffix}${ext}`;
  callback(null, safeFilename);
}

/**
 * Validates file MIME type and extension against the allowlist.
 */
export function fileFilter(
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

  if (!isMimeAllowed || !isExtAllowed) {
    return callback(
      new BadRequestException(
        `Unsupported file type '${ext || file.mimetype}'. Allowed formats: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, JPG, PNG.`,
      ),
      false,
    );
  }

  callback(null, true);
}

/**
 * Multer upload options for FileInterceptor.
 */
export const multerUploadOptions: Options = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      cb(null, UPLOAD_DIR);
    },
    filename: editFileName,
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
};
