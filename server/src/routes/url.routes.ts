import { Router, Request, Response } from "express";
import { nanoid } from "nanoid";
import pool from "../db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const urlRouter = Router();

urlRouter.use(authMiddleware);

urlRouter.post("/", async (req: Request, res: Response) => {
    try {
        let { originalUrl } = req.body;
        const userId = (req as any).userId;

        if (!originalUrl || typeof originalUrl !== "string") {
            return res.status(400).json({ error: "originalUrl is required" });
        }

        originalUrl = originalUrl.trim();

        if (!originalUrl.startsWith("http://") && !originalUrl.startsWith("https://")) {
            originalUrl = `https://${originalUrl}`;
        }

        try {
            new URL(originalUrl);
        } catch {
            return res.status(400).json({ error: "Invalid URL" });
        }

        const shortCode = nanoid(6);

        const result = await pool.query(
            `INSERT INTO short_urls (original_url, short_code, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [originalUrl, shortCode, userId]
        );

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Create short URL error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

urlRouter.get("/", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const result = await pool.query(
            `SELECT * FROM short_urls
       WHERE user_id = $1
       ORDER BY created_at DESC`,
            [userId]
        );

        return res.status(200).json({ urls: result.rows });
    } catch (err) {
        console.error("Fetch short URLs error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
urlRouter.delete("/:id", async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const userId = (req as any).userId;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid link id" });
        }

        const result = await pool.query(
            `SELECT * FROM short_urls WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Short link not found" });
        }

        const link = result.rows[0];

        if (link.user_id !== userId) {
            return res
                .status(403)
                .json({ error: "You cannot delete someone else's link" });
        }

        await pool.query(`DELETE FROM short_urls WHERE id = $1`, [id]);

        return res.status(200).json({ message: "Short link deleted successfully" });
    } catch (err) {
        console.error("Delete short URL error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
export default urlRouter;