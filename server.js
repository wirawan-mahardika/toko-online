import app from "./src/app.js";
import { prismaClient } from "./src/database/prisma-client.js";

try {
  await prismaClient.$connect();
} catch (error) {
  console.log(error);
}

const PORT = process.env.PORT
app.listen(PORT, () => console.log('server is listening at port', PORT))