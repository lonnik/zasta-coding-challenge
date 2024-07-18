import { Request, Response } from "express";
import { Field, RequestBody, Token, Value } from "./types";
import {
  createTokenValueMapping,
  getTokenValueMappingByTokens,
} from "./queries";
import { decrypt, encrypt } from "./util";

export const tokenizeHandler = async (
  req: Request<any, any, RequestBody>,
  res: Response
) => {
  const { id, data } = req.body;

  const tokenizedData: { [key: Field]: Token } = {};

  // NOTE: it would be more performant to use a single query to insert all values instead of one query per value
  for (const field in data) {
    const { encryptedData, iv } = encrypt(
      data[field],
      process.env.DATA_ENCRYPTION_KEY_HEX!
    );

    let token: Token = "";
    try {
      const res = await createTokenValueMapping(encryptedData, iv);
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
  req: Request<any, any, RequestBody>,
  res: Response
) => {
  const { id, data } = req.body;

  const tokens = Object.values(data);
  let tokenValueMap: Awaited<ReturnType<typeof getTokenValueMappingByTokens>> =
    new Map();
  try {
    tokenValueMap = await getTokenValueMappingByTokens(tokens);
  } catch (error) {
    console.error("Error getting token value mapping", error);

    // NOTE: normally you would want to inspect the error and return a http status code based on the error
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  // NOTE: there is no verification that the request field/token pairs are valid or that they are associated with the id in the request

  const responseData: { [key: Field]: { found: boolean; value: string } } = {};
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
