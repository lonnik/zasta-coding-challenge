import supertest from "supertest";
import { server } from "./server";

describe("server", () => {
  it("should return hello world", async () => {
    await supertest(server)
      .get("/hello-world")
      .expect(200)
      .expect("hello world");
  });
});
