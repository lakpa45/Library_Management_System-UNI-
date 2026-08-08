import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

console.log('DATABASE_URL', process.env.DATABASE_URL);

export const signup = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password} = req.body;

        // checks if member is already exists
        const existingMember = await prisma.member.findUnique({
            where: { email }
        });

        if(existingMember) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create a new member
        const newMember = await prisma.member.create({
            data: {
                first_name,
                last_name,
                email,
                password: hashedPassword,
                phone
            }
        });

        // send response
        res.status(201).json({
            message: 'Sign up successful',
            member: {
                id: newMember.memberId,
                first_name: newMember.first_name,
                last_name: newMember.last_name,
                email: newMember.email,
                phone: newMember.phone
            }
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};