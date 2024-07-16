import supertest from "supertest";
import { server } from "./server";
import { Field, Token } from "./types";

describe("server", () => {
  // TODO: reset the data store
  afterEach(async () => {});

  const tokenizationData = {
    field1: "value1",
    field2: "value2",
    field3: "value3",
  };

  describe("POST /tokenize", () => {
    const id = "req-123";

    it("should return status code 201 and body with tokenized data", async () => {
      const payload = {
        id: id,
        data: tokenizationData,
      };

      await supertest(server)
        .post("/tokenize")
        .send(payload)
        .expect(201)
        .expect("Content-Type", /json/)
        .expect((res) => {
          expect(res.body).toEqual({
            id: id,
            data: {
              field1: expect.any(String),
              field2: expect.any(String),
              field3: expect.any(String),
            },
          });
        });
    });
    it("should return status code 400 if the id field in the request payload is missing", async () => {
      const payload = {
        data: tokenizationData,
      };

      await supertest(server).post("/tokenize").send(payload).expect(400);
    });
    it("should return status code 400 if the data field in the request payload is missing", async () => {
      const payload = {
        id: id,
      };

      await supertest(server).post("/tokenize").send(payload).expect(400);
    });
    it("should return status code 400 if the id field is not a string", async () => {
      const payload = {
        id: 123,
        data: tokenizationData,
      };

      await supertest(server).post("/tokenize").send(payload).expect(400);
    });
    it("should return status code 400 if the type of the data field is incorrect", async () => {
      const payload = {
        id: id,
        data: "string that should be an object",
      };

      await supertest(server).post("/tokenize").send(payload).expect(400);
    });
  });
  describe("POST /detokenize", () => {
    const id1 = "req-33445";
    const id2 = "req-123";
    let tokenizedData: { [key: Field]: Token };

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

      const res = await supertest(server).post("/tokenize").send(payload);
      tokenizedData = res.body.data;

      await supertest(server).post("/tokenize").send(payload2);
    });

    // TODO: reset the data store
    afterAll(async () => {});

    it("should return status code 200 and body with detokenized data", async () => {
      const payload = {
        id: id1,
        data: { ...tokenizedData },
      };

      await supertest(server)
        .post("/detokenize")
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
              found: true,
              value: "value3",
            },
          },
        });
    });
    it("should return status code 400 if the id field in the request payload is missing", async () => {
      const payload = {
        data: tokenizedData,
      };

      await supertest(server).post("/detokenize").send(payload).expect(400);
    });
    it("should return status code 400 if the data field in the request payload is missing", async () => {
      const payload = {
        id: id1,
      };

      await supertest(server).post("/detokenize").send(payload).expect(400);
    });
    it("should return status code 400 if a resource with the id was not found", async () => {
      const payload = {
        id: "invalid id",
        data: tokenizedData,
      };

      await supertest(server).post("/detokenize").send(payload).expect(400);
    });
    it("should return status code 400 if a token is not associated with a field key", async () => {
      const payload = {
        id: id1,
        data: { ...tokenizedData, field1: tokenizedData.field2 },
      };

      await supertest(server).post("/detokenize").send(payload).expect(400);
    });
    it("should return status code 400 if a field key is not associated with a token and an id", async () => {
      const payload = {
        id: id1,
        data: { ...tokenizedData, field4: tokenizedData.field1 },
      };

      await supertest(server).post("/detokenize").send(payload).expect(400);
    });
    it("should return status code 400 if an id is not associated with a field key and its token", async () => {
      const payload = {
        id: id2,
        data: { field1: tokenizedData.field1 },
      };

      await supertest(server).post("/detokenize").send(payload).expect(400);
    });
  });
});
