import crypto from "crypto";

const algorithm = "aes-256-cbc";

export const encrypt = (data: string, hexKey: string) => {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(hexKey, "hex");

  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return { iv, encryptedData: encrypted };
};

export const decrypt = (data: Buffer, hexKey: string, iv: Buffer) => {
  const key = Buffer.from(hexKey, "hex");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  let decrypted = decipher.update(data);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted;
};
