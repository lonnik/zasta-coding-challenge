import { genSalt, hash } from "bcryptjs";
import { query } from "./db";
import { Role, ServiceTableRow, Token, TokenTableRow } from "./type";

// CREATE TABLE statements

export const createServicesTable = async () => {
  await query(`
    CREATE TYPE role AS ENUM ('VISITOR', 'TOKENIZER', 'DETOKENIZER');
  `);
  await query(`
  CREATE TABLE IF NOT EXISTS services (
    service_id VARCHAR(256) PRIMARY KEY,
    hashed_secret VARCHAR(60) NOT NULL,
    role role NOT NULL
  )
`);
};

export const createTokensTable = async () => {
  await query(`
  CREATE TABLE IF NOT EXISTS tokens (
    token UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    encrypted_value BYTEA NOT NULL,
    iv BYTEA NOT NULL
  )
`);
};

// INSERT statements

export const insertToken = async (encryptedValue: Buffer, iv: Buffer) => {
  const res = await query<TokenTableRow>(
    `INSERT INTO tokens (encrypted_value, iv) 
    VALUES ($1, $2) 
    RETURNING *`,
    [encryptedValue, iv]
  );

  return res.rows[0];
};

export const insertService = async (
  serviceId: string,
  secret: string,
  role: Role
) => {
  const salt = await genSalt(10);
  const hashedSecret = await hash(secret, salt);

  const res = await query<ServiceTableRow>(
    `INSERT INTO services (service_id, hashed_secret, role) 
    VALUES ($1, $2, $3)
    RETURNING *`,
    [serviceId, hashedSecret, role.toString()]
  );

  return res.rows[0];
};

// SELECT statements

export const getToken = async (tokens: Token[]) => {
  const res = await query<TokenTableRow>(
    `SELECT * 
    FROM tokens 
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

export const getService = async (serviceId: string) => {
  const res = await query<ServiceTableRow>(
    `SELECT * 
    FROM services 
    WHERE service_id = $1`,
    [serviceId]
  );

  return res.rows[0];
};

// TRUNCATE TABLE statements

export const truncateTokensTable = async () => {
  await query("TRUNCATE TABLE tokens");
};
