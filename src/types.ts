import { z } from "zod";
import { requestBody as requestBodySchema } from "./schema";

export type Token = string;
export type Id = string;
export type Field = string;
export type Value = string;
export type RequestBody = z.infer<typeof requestBodySchema>;
