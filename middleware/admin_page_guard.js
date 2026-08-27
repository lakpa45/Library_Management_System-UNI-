import jwt from 'jsonwebtoken';

export const requireAdminPage = (req, res, next) => {
    const token = req.cookies?.adminSession;

    if (!token) {
        return res.redirect('/');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin' && decoded.role !== 'librarian') {
            return res.redirect('/');
        }
        req.admin = decoded;
        next();
    } catch (err) {
        res.clearCookie('adminSession');
        return res.redirect('/');
    }
};
