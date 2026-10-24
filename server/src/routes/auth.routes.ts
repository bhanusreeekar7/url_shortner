import { Router, Response, Request } from "express";
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import pool from "../db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const authroutes = Router();

authroutes.post('/register', async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400).json({ message: "Please provide all the details" });
        return;
    }
    try {
        const alreadyexist = await pool.query(
            `SELECT * FROM short_users WHERE email = $1`, [email]
        );
        if (alreadyexist.rows.length !== 0) {
            res.status(400).json({ error: "Email already exists" });
            return;
        }
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO short_users (name, email, password_hash) 
             VALUES ($1, $2, $3) 
             RETURNING id, name, email, created_at`,
            [name, email, hash]
        );

        const token = jwt.sign(
            { userId: result.rows[0].id },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

authroutes.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
    }

    try {
        const userRes = await pool.query(
            `SELECT * FROM short_users WHERE email = $1`,
            [email]
        );

        if (userRes.rows.length === 0) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        const user = userRes.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

authroutes.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.status(200).json({ message: "Logged out successfully" });
});

authroutes.get('/me', authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    try {
        const userRes = await pool.query(
            `SELECT id, name, email, created_at FROM short_users WHERE id = $1`,
            [userId]
        );
        if (userRes.rows.length === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({ user: userRes.rows[0] });
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

export default authroutes;
