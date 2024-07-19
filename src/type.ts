import { z } from "zod";
import {
  tokenizeRequestBody as tokenizeRequestBodySchema,
  detokenizeRequestBody as detokenizeRequestBodySchema,
  authRequestBody as authRequestBodySchema,
} from "./schema";

export type UUID = string;
export type Token = UUID;
export type Value = string;

export type TokenTableRow = {
  token: Token;
  encrypted_value: Buffer;
  iv: Buffer;
};

export enum Role {
  VISITOR = "VISITOR",
  TOKENIZER = "TOKENIZER",
  DETOKENIZER = "DETOKENIZER",
}

export type ServiceTableRow = {
  service_id: string;
  hashed_secret: string;
  role: Role;
};

export type Service = {
  serviceId: string;
  secret: string;
  role: Role;
};

export type TokenizeRequestBody = z.infer<typeof tokenizeRequestBodySchema>;
export type DetokenizeRequestBody = z.infer<typeof detokenizeRequestBodySchema>;
export type AuthRequestBody = z.infer<typeof authRequestBodySchema>;

export type JwtPayload = { serviceId: string; role: Role };
