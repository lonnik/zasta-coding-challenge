import { Request, Response } from "express";
import {
  TokenizeRequestBody,
  AuthRequestBody,
  Token,
  DetokenizeRequestBody,
} from "./type";
import { insertToken, getToken, getService } from "./queries";
import { decrypt, encrypt } from "./util";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";

export const authenticateHandler = async (
  req: Request<any, any, AuthRequestBody>,
  res: Response
) => {
  const { serviceId, secret } = req.body;

  const service = await getService(serviceId);

  if (service === undefined) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const secretIsValid = await compare(secret, service.hashed_secret);
  if (!secretIsValid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = jwt.sign(
    { role: service.role, serviceId },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  res.status(200).json({ token });
};

export const tokenizeHandler = async (
  req: Request<any, any, TokenizeRequestBody>,
  res: Response
) => {
  const { id, data } = req.body;

  const tokenizedData: { [key: string]: Token } = {};

  // NOTE: it would be more performant to use a single query to insert all values instead of one query per value
  for (const field in data) {
    const { encryptedData, iv } = encrypt(
      data[field],
      process.env.DATA_ENCRYPTION_KEY_HEX!
    );

    let token: Token = "";
    try {
      const res = await insertToken(encryptedData, iv);
      token = res.token;
    } catch (error) {
      console.error("Error creating token value mapping", error);

      // NOTE: normally you would want to return check the error type and return a more specific http status code
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    tokenizedData[field] = token;
  }

  res.status(201).json({
    id,
    data: tokenizedData,
  });
};

export const detokenizeHandler = async (
  req: Request<any, any, DetokenizeRequestBody>,
  res: Response
) => {
  const { id, data } = req.body;

  const tokens = Object.values(data);
  let tokenValueMap: Awaited<ReturnType<typeof getToken>> = new Map();
  try {
    tokenValueMap = await getToken(tokens);
  } catch (error) {
    console.error("Error getting token value mapping", error);

    // NOTE: normally you would want to inspect the error and return a http status code based on the error
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  // NOTE: there is no verification that the request field/token pairs are valid or that they are associated with the id in the request

  const responseData: { [key: string]: { found: boolean; value: string } } = {};
  for (const field in data) {
    responseData[field] = { found: false, value: "" };
    const token = data[field];
    const encryptedValues = tokenValueMap.get(token);

    if (encryptedValues === undefined) {
      continue;
    }

    const value = decrypt(
      encryptedValues.encryptedValue,
      process.env.DATA_ENCRYPTION_KEY_HEX!,
      encryptedValues.iv
    ).toString();

    responseData[field].value = value;
    responseData[field].found = true;
  }

  res.status(200).json({
    id,
    data: responseData,
  });
};
