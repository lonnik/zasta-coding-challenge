import { RequestHandler } from "express";

export const validateRequestBody =
  (schema: Zod.Schema): RequestHandler =>
  (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({ error: "Request body malformed" });
    }
  };
