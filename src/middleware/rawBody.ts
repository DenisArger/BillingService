import { Request, Response, NextFunction } from "express";

/**
 * Middleware to capture raw body for webhook signature verification
 */
export function captureRawBody(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.path === "/webhooks/payment") {
    let data = "";
    req.setEncoding("utf8");

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      (req as any).rawBody = data;
      next();
    });
  } else {
    next();
  }
}
