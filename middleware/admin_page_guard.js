import jwt from 'jsonwebtoken';

export const requireAdminPage = (req, res, next) => {
    const token = req.cookies?.adminSession;

    if (!token) {
        return res.redirect('/admin_login.html');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.redirect('/admin_login.html');
        }
        req.admin = decoded;
        next();
    } catch (err) {
        res.clearCookie('adminSession');
        return res.redirect('/admin_login.html');
    }
};