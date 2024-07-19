import { z } from "zod";

export const tokenizeRequestBody = z.object({
  id: z.string(),
  data: z.record(z.string(), z.string()),
});

export const detokenizeRequestBody = tokenizeRequestBody;

export const authRequestBody = z.object({
  serviceId: z.string(),
  secret: z.string(),
});
