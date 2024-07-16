import { z } from "zod";

export const requestBody = z.object({
  id: z.string(),
  data: z.record(z.string(), z.string()),
});
