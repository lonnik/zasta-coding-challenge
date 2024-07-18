import { query } from "./db";
import { Token, TokenValueMapping } from "./types";

export const createTokenValueMappingTable = async () => {
  await query(`
  CREATE TABLE IF NOT EXISTS token_value_mappings (
    token UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    encrypted_value BYTEA NOT NULL,
    iv BYTEA NOT NULL
  )
`);
};

export const createTokenValueMapping = async (
  encryptedValue: Buffer,
  iv: Buffer
) => {
  const res = await query<TokenValueMapping>(
    `INSERT INTO token_value_mappings (encrypted_value, iv) 
    VALUES ($1, $2) 
    RETURNING *`,
    [encryptedValue, iv]
  );

  return res.rows[0];
};

export const getTokenValueMappingByTokens = async (tokens: Token[]) => {
  const res = await query<TokenValueMapping>(
    `SELECT * 
    FROM token_value_mappings 
    WHERE token = ANY($1)`,
    [tokens]
  );

  const tokenValueMap = new Map<
    Token,
    { encryptedValue: Buffer; iv: Buffer }
  >();
  res.rows.forEach((row) => {
    tokenValueMap.set(row.token, {
      encryptedValue: row.encrypted_value,
      iv: row.iv,
    });
  });

  return tokenValueMap;
};

export const truncateTables = async () => {
  await query("TRUNCATE TABLE token_value_mappings");
};
