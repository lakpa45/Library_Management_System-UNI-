import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter  = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // check for existing email or phone
        const member = await prisma.member.findUnique({
            where: { email }
        });

        if(!member) {
            return res.status(401).json({ message: 'Invalid email or password '});
        }

        // comparing the entered password with hashed password
        const isMatch = await bcrypt.compare(password, member.password);

        if(!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // generate JWT token
        const token = jwt.sign(
            { id: member.member_id, email: member.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // send response
        res.status(200).json({
            message: 'Sign in successful',
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' })
    }
};