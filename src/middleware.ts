import { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload, Role } from "./type";

type AuthenticatedRequest = Request & {
  token: JwtPayload;
};

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

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    (req as AuthenticatedRequest).token = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const authorize =
  (roles: Role[]): RequestHandler =>
  (req, res, next) => {
    const { role } = (req as AuthenticatedRequest).token;

    if (!roles.includes(role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
