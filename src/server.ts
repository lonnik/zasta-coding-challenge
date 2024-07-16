import express from "express";
import { router } from "./router";

export const server = express();

server.use(express.json());

server.use(router);
