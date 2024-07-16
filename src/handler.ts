import { Request, Response } from "express";
import { generateToken } from "./util";
import { Field, RequestBody, Token } from "./types";
import { reverseTokenStore, tokenStore } from "./data";

export const tokenizeHandler = (
  req: Request<any, any, RequestBody>,
  res: Response
) => {
  const { id, data: inputData } = req.body;

  const tokenizedData: { [key: Field]: Token } = {};

  for (const field in inputData) {
    const token = generateToken();
    const value = inputData[field];

    tokenizedData[field] = token;
    reverseTokenStore.set(token, value);
  }

  tokenStore.set(id, tokenizedData);

  res.status(201).json({
    id,
    data: tokenizedData,
  });
};

export const detokenizeHandler = (
  req: Request<any, any, RequestBody>,
  res: Response
) => {
  const { id, data: requestData } = req.body;

  const tokenizedData = tokenStore.get(id);

  // verify that resource with the id is in the data store
  if (tokenizedData === undefined) {
    res
      .status(400)
      .json({ error: `No resource associated with id: ${id} found` });
    return;
  }

  const responseBody: { [key: Field]: { found: boolean; value: string } } = {};

  for (const field in requestData) {
    // verify that the token, the field name and the id of the request data are associated
    if (requestData[field] !== tokenizedData[field]) {
      res.status(400).json({ error: "The data object is not valid" });
      return;
    }

    responseBody[field] = { found: false, value: "" };
    const token = requestData[field];
    const value = reverseTokenStore.get(token);

    if (value === undefined) {
      continue;
    }

    responseBody[field].value = value;
    responseBody[field].found = true;
  }

  res.status(200).json({
    id,
    data: responseBody,
  });
};
