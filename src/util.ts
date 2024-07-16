import { v4 as uuidv4 } from "uuid";
import { Token } from "./types";

export const generateToken = (): Token => {
  return uuidv4();
};
