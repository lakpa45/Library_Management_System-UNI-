import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up storage configuration for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = file.fieldname === 'book_pdf'
            ? path.join(__dirname, '..', 'public', 'pdfs', 'books')
            : path.join(__dirname, '..', 'public', 'images', 'books');
        fs.mkdirSync(folder, { recursive: true });
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '-');
        const uniqueName = Date.now() + '-' + safeName;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        console.log({
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            extension: path.extname(file.originalname).toLowerCase()
        });

        const validCover = file.fieldname === 'cover_image' && ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
        const validPdf = file.fieldname === 'book_pdf' && file.mimetype === 'application/pdf';
        const valid = validCover || validPdf;
        cb(valid ? null : new Error('Only JPG, PNG, WebP images and PDF files are allowed.'), valid);
    }
});

export default upload;
