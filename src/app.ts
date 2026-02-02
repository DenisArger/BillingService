import express, { Express, Request, Response, NextFunction } from "express";
import { config } from "./config";
import routes from "./routes";

export function createApp(): Express {
  const app = express();

  // Middleware for capturing raw body (needed for webhook signature verification)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === "/webhooks/payment") {
      let data = "";
      req.setEncoding("utf8");

      req.on("data", (chunk) => {
        data += chunk;
      });

      req.on("end", () => {
        (req as any).rawBody = data;
        // Parse JSON manually after capturing raw body
        try {
          req.body = JSON.parse(data);
        } catch (error) {
          req.body = {};
        }
        next();
      });
    } else {
      next();
    }
  });

  // JSON parser for non-webhook routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path !== "/webhooks/payment") {
      express.json()(req, res, next);
    } else {
      next();
    }
  });

  // Routes
  app.use(routes);

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
    });
  });

  return app;
}
