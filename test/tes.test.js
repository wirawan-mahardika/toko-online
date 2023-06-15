import app from "../src/app.js";
import supertest from "supertest";
import { prismaClient } from "../src/database/prisma-client.js";

const req = supertest(app);

test("asdfasdfasdf", async () => {
  const res = await req.get("/");
  expect(res.text).toBe("hello world");
});
