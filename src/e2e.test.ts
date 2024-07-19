import supertest from "supertest";
import { app } from "./app";
import { migrate } from "./db/migrate";
import { pool } from "./db";
import { Service, Token } from "./type";
import { truncateTokensTable } from "./queries";
import { v4 as uuidv4 } from "uuid";
import { seedServices } from "./db/seed";
import { services as serviceFixtures } from "./fixtures";

describe("server", () => {
  let visitorToken: string;
  let tokenizerToken: string;
  let detokenizerToken: string;

  beforeAll(async () => {
    await migrate();
    await seedServices(serviceFixtures);

    // obtain JWT tokens for visitor, tokenizer and detokenizer role
    visitorToken = await getJwtToken(serviceFixtures[0]);
    tokenizerToken = await getJwtToken(serviceFixtures[1]);
    detokenizerToken = await getJwtToken(serviceFixtures[2]);
  });

  afterAll(async () => {
    await pool.end();
  });

  const tokenizationData = {
    field1: "value1",
    field2: "value2",
    field3: "value3",
  };

  describe("POST /tokenize", () => {
    afterEach(async () => {
      await truncateTokensTable();
    });

    const id = "req-123";

    it("should return status code 201 and body with tokenized data", async () => {
      const payload = {
        id,
        data: tokenizationData,
      };
      await supertest(app)
        .post("/tokenize")
        .auth(tokenizerToken, { type: "bearer" })
        .send(payload)
        .expect(201)
        .expect("Content-Type", /json/)
        .expect((res) => {
          expect(res.body).toEqual({
            id,
            data: {
              field1: expect.any(String),
              field2: expect.any(String),
              field3: expect.any(String),
            },
          });
        });
    });
    it("should return status code 401 if the request is not authenticated", async () => {
      const payload = {
        id,
        data: tokenizationData,
      };

      await supertest(app).post("/tokenize").send(payload).expect(401);
    });
    it("should return status code 401 if the request is authenticated with an invalid token", async () => {
      const payload = {
        id,
        data: tokenizationData,
      };

      await supertest(app)
        .post("/tokenize")
        .auth("invalid token", { type: "bearer" })
        .send(payload)
        .expect(401);
    });
    it("should return status code 403 if the request is authenticated with a token that does not have the correct role", async () => {
      const payload = {
        id,
        data: tokenizationData,
      };

      await supertest(app)
        .post("/tokenize")
        .auth(visitorToken, { type: "bearer" })
        .send(payload)
        .expect(403);
    });
    it("should return status code 400 if the id field in the request payload is missing", async () => {
      const payload = {
        data: tokenizationData,
      };

      await supertest(app)
        .post("/tokenize")
        .auth(tokenizerToken, { type: "bearer" })
        .send(payload)
        .expect(400);
    });
    it("should return status code 400 if the data field in the request payload is missing", async () => {
      const payload = {
        id,
      };

      await supertest(app)
        .post("/tokenize")
        .auth(tokenizerToken, { type: "bearer" })
        .send(payload)
        .expect(400);
    });
    it("should return status code 400 if the id field is not a string", async () => {
      const payload = {
        id: 123,
        data: tokenizationData,
      };

      await supertest(app)
        .post("/tokenize")
        .auth(tokenizerToken, { type: "bearer" })
        .send(payload)
        .expect(400);
    });
    it("should return status code 400 if the type of the data field is incorrect", async () => {
      const payload = {
        id,
        data: "string that should be an object",
      };

      await supertest(app)
        .post("/tokenize")
        .auth(tokenizerToken, { type: "bearer" })
        .send(payload)
        .expect(400);
    });
  });
  describe("POST /detokenize", () => {
    const id1 = "req-33445";
    const id2 = "req-123";
    let tokenizedData: { [key: string]: Token };

    beforeAll(async () => {
      const payload = {
        id: id1,
        data: tokenizationData,
      };

      const payload2 = {
        id: id2,
        data: {
          field4: "value4",
          field5: "value5",
          field6: "value6",
        },
      };

      const res = await supertest(app)
        .post("/tokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(payload);
      tokenizedData = res.body.data;

      await supertest(app).post("/tokenize").send(payload2);
    });

    afterAll(async () => {
      await truncateTokensTable();
    });

    it("should return status code 200 and body with detokenized data", async () => {
      const invalidToken = uuidv4();
      const payload = {
        id: id1,
        data: { ...tokenizedData, field3: invalidToken },
      };

      await supertest(app)
        .post("/detokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(payload)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect({
          id: id1,
          data: {
            field1: {
              found: true,
              value: "value1",
            },
            field2: {
              found: true,
              value: "value2",
            },
            field3: {
              found: false,
              value: "",
            },
          },
        });
    });
    it("should return status code 401 if the request is not authenticated", async () => {
      const payload = {
        id: id1,
        data: tokenizedData,
      };

      await supertest(app).post("/detokenize").send(payload).expect(401);
    });
    it("should return status code 403 if the request is authenticated with a token that does not have the correct role", async () => {
      const payload = {
        id: id1,
        data: tokenizedData,
      };

      await supertest(app)
        .post("/detokenize")
        .auth(tokenizerToken, { type: "bearer" })
        .send(payload)
        .expect(403);
    });
    it("should return status code 400 if the id field in the request payload is missing", async () => {
      const payload = {
        data: tokenizedData,
      };

      await supertest(app)
        .post("/detokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(payload)
        .expect(400);
    });
    it("should return status code 400 if the data field in the request payload is missing", async () => {
      const payload = {
        id: id1,
      };

      await supertest(app)
        .post("/detokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(payload)
        .expect(400);
    });
    it.skip("should return status code 400 if a resource with the id was not found", async () => {
      const payload = {
        id: "invalid id",
        data: tokenizedData,
      };

      await supertest(app)
        .post("/detokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(payload)
        .expect(400);
    });
    it.skip("should return status code 400 if a token is not associated with a field key", async () => {
      const payload = {
        id: id1,
        data: { ...tokenizedData, field1: tokenizedData.field2 },
      };

      await supertest(app)
        .post("/detokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(payload)
        .expect(400);
    });
    it.skip("should return status code 400 if a field key is not associated with a token and an id", async () => {
      const payload = {
        id: id1,
        data: { ...tokenizedData, field4: tokenizedData.field1 },
      };

      await supertest(app)
        .post("/detokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(payload)
        .expect(400);
    });
    it.skip("should return status code 400 if an id is not associated with a field key and its token", async () => {
      const payload = {
        id: id2,
        data: { field1: tokenizedData.field1 },
      };

      await supertest(app)
        .post("/detokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(payload)
        .expect(400);
    });
  });

  describe("POST /tokenize and POST /detokenize", () => {
    const id = "req-123";

    afterEach(async () => {
      await truncateTokensTable();
    });

    it("should correctly tokenize and detokenize a very long string", async () => {
      const longString = "a".repeat(10000);
      const payload = {
        id,
        data: {
          field1: longString,
        },
      };

      const res = await supertest(app)
        .post("/tokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(payload);
      const tokenizedData = res.body.data;

      const detokenizePayload = {
        id,
        data: tokenizedData,
      };

      await supertest(app)
        .post("/detokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(detokenizePayload)
        .expect(200)
        .expect({
          id,
          data: {
            field1: {
              found: true,
              value: longString,
            },
          },
        });
    });
    it("should correctly tokenize and detokenize numerical string", async () => {
      const numberString = "1234567890";

      const payload = {
        id,
        data: {
          field1: numberString,
        },
      };

      const res = await supertest(app)
        .post("/tokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(payload);
      const tokenizedData = res.body.data;

      const detokenizePayload = {
        id,
        data: tokenizedData,
      };

      await supertest(app)
        .post("/detokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(detokenizePayload)
        .expect(200)
        .expect({
          id,
          data: {
            field1: {
              found: true,
              value: numberString,
            },
          },
        });
    });
    it("should correctly tokenize and detokenize special characters", async () => {
      const specialCharacters = "!@#$%^&*()_+";

      const payload = {
        id,
        data: {
          field1: specialCharacters,
        },
      };

      const res = await supertest(app)
        .post("/tokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(payload);
      const tokenizedData = res.body.data;

      const detokenizePayload = {
        id,
        data: tokenizedData,
      };

      await supertest(app)
        .post("/detokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(detokenizePayload)
        .expect(200)
        .expect({
          id,
          data: {
            field1: {
              found: true,
              value: specialCharacters,
            },
          },
        });
    });
    it("should correctly tokenize and detokenize an empty string", async () => {
      const emptyString = "";

      const payload = {
        id,
        data: {
          field1: emptyString,
        },
      };

      const res = await supertest(app)
        .post("/tokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(payload);
      const tokenizedData = res.body.data;

      const detokenizePayload = {
        id,
        data: tokenizedData,
      };

      await supertest(app)
        .post("/detokenize")
        .auth(detokenizerToken, { type: "bearer" })
        .send(detokenizePayload)
        .expect(200)
        .expect({
          id,
          data: {
            field1: {
              found: true,
              value: emptyString,
            },
          },
        });
    });
  });
});

const getJwtToken = async (service: Service) => {
  const res = await supertest(app)
    .post("/auth")
    .send({
      serviceId: service.serviceId,
      secret: service.secret,
    })
    .expect(200);

  return res.body.token as string;
};
