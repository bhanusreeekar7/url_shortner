import { Router, Request, Response } from "express";
import pool from "../db.js";

const redirectRouter = Router();

redirectRouter.get('/:shortcode', async (req: Request, res: Response) => {
    const { shortcode } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, original_url FROM short_urls WHERE short_code = $1`,
            [shortcode]
        );

        if (result.rows.length === 0) {
            const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Link Not Found - SnipURL</title>
                    <style>
                        body { background: #050505; color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; box-sizing: border-box; }
                        .card { background: rgba(18, 18, 18, 0.85); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 2.5rem; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6); }
                        h1 { font-size: 1.5rem; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
                        p { color: #8f8d86; margin-bottom: 1.75rem; font-size: 0.95rem; line-height: 1.5; }
                        a { color: #000; background: #fff; text-decoration: none; padding: 0.75rem 1.4rem; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 0.9rem; transition: background 0.15s ease; }
                        a:hover { background: #e5e5e5; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>Link Not Found</h1>
                        <p>This short link does not exist, has expired, or was removed by its owner.</p>
                        <a href="${clientUrl}">Go to SnipURL</a>
                    </div>
                </body>
                </html>
            `);
        }

        const { id, original_url } = result.rows[0];

        pool.query(`UPDATE short_urls SET clicks = clicks + 1 WHERE id = $1`, [id]).catch(err => {
            console.error("Click increment error:", err);
        });

        return res.redirect(302, original_url);
    } catch (err) {
        console.error("Redirect error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default redirectRouter;
