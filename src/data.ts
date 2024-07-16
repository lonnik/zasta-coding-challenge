import { Field, Id, Token, Value } from "./types";

// maps id, field key and token
export const tokenStore = new Map<Id, { [key: Field]: Token }>();

// maps token and value
export const reverseTokenStore = new Map<Token, Value>();
