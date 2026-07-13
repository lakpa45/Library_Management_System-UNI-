import bcrypt from 'bcrypt';
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

export const signup = async (req, res) => {
    try {
        const { first_name, middle_namme, last_name, email, phone}
    }
}