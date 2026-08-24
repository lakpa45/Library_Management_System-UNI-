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

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// admin login route
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin_login.html'));
});

// Map of clean admin pages
const ADMIN_PAGES = {
    'dashboard': 'admin_dashboard.html',
    'books': 'admin_bk_category.html',
    'borrow-return': 'admin_borrow_ret_bk.html',
    'members': 'admin_members.html',
    'register-member': 'register_member.html',
};

// guarded admin pages — one route covers all of views/admin
app.get('/admin/:page', requireAdminPage, (req, res) => {
    const filename = ADMIN_PAGES[req.params.page];

    if (!filename) {
        return res.status(404).send('Not found');
    }

    res.sendFile(path.join(__dirname, 'views', 'admin', filename));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});