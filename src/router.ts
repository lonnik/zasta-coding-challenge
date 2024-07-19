import { Router } from "express";
import {
  authenticateHandler,
  detokenizeHandler,
  tokenizeHandler,
} from "./handler";
import { authenticate, authorize, validateRequestBody } from "./middleware";
import {
  tokenizeRequestBody as tokenizeRequestBodySchema,
  detokenizeRequestBody as detokenizeRequestBodySchema,
  authRequestBody as authRequestBodySchema,
} from "./schema";
import { Role } from "./type";

export const router = Router();

router.post(
  "/tokenize",
  authenticate,
  authorize([Role.TOKENIZER, Role.DETOKENIZER]),
  validateRequestBody(tokenizeRequestBodySchema),
  tokenizeHandler
);

router.post(
  "/detokenize",
  authenticate,
  authorize([Role.DETOKENIZER]),
  validateRequestBody(detokenizeRequestBodySchema),
  detokenizeHandler
);

router.post(
  "/auth",
  validateRequestBody(authRequestBodySchema),
  authenticateHandler
);
