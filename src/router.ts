import { Router } from "express";
import { detokenizeHandler, tokenizeHandler } from "./handler";
import { validateRequestBody } from "./middleware";
import { requestBody as requestBodySchema } from "./schema";

export const router = Router();

router.post(
  "/tokenize",
  validateRequestBody(requestBodySchema),
  tokenizeHandler
);

router.post(
  "/detokenize",
  validateRequestBody(requestBodySchema),
  detokenizeHandler
);
