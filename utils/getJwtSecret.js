import dotenv from 'dotenv';
dotenv.config();

export const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
