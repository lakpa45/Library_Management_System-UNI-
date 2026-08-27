import 'dotenv/config';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import librarianRoutes from './routes/librarianRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import { requireAdminPage } from './middleware/admin_page_guard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views'), {
    index: false,
    setHeaders: (res, filePath) => {
        if (filePath.includes(path.join('views', 'admin'))) {
            res.status(404);
        }
    }
}));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/librarians', librarianRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/e-books', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'e_books.html'));
});

app.get('/books', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'all_books.html'));
});

app.get('/categories', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'categories.html'));
});

app.get('/my-books', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'my_books.html'));
});

// Map of clean admin pages
const ADMIN_PAGES = {
    'dashboard': 'admin_dashboard.html',
    'librarians': 'admin_librarians.html',
    'audit-logs': 'admin_audit_logs.html',
};

const LIBRARIAN_PAGES = {
    'dashboard': 'librarian_dashboard.html',
    'book-categories': 'librarian_book_category.html',
    'books': 'librarian_books.html',
    'borrow-return': 'librarian_borrow_return.html',
    'members': 'librarian_members.html',
    'pending-members': 'librarian_pending_members.html',
    'register-member': 'librarian_register_member.html',
};

// guarded admin pages — one route covers all of views/admin
app.get('/admin/:page', requireAdminPage, (req, res) => {
    const filename = ADMIN_PAGES[req.params.page];

    if (!filename) {
        return res.status(404).send('Not found');
    }

    if (['librarians', 'audit-logs'].includes(req.params.page) && req.admin.role !== 'admin') {
        return res.status(403).send('Administrator access required');
    }

    res.sendFile(path.join(__dirname, 'views', 'admin', filename));
});

app.get('/librarian/:page', requireAdminPage, (req, res) => {
    const filename = LIBRARIAN_PAGES[req.params.page];

    if (!filename) {
        return res.status(404).send('Not found');
    }

    res.sendFile(path.join(__dirname, 'views', 'librarian', filename));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
