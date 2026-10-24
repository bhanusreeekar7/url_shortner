import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config'

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.cookies;
    if (!token) {
        res.status(401).json({
            message: "Token not provided"
        });
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
        (req as any).userId = decoded.userId;
        next();

    }
    catch (error) {
        res.status(401).json({
            error: "Invalid or expired token"
        });

    }
}