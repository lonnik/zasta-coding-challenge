import { Router } from "express";

export const router = Router();

router.get("/hello-world", async (_, res) => {
  res.send("hello world");
});
