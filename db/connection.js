import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL is missing from the Node.js Railway service"
    );
}

const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on("connect", () => {
    console.log("Connected to Railway PostgreSQL");
});

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL error:", error.message);
});

export default pool;