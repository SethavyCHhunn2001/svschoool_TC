import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const examplePath = path.resolve(".env.example");
const envPath = path.resolve(".env");

let example;
try {
  example = await readFile(examplePath, "utf8");
} catch (error) {
  if (error.code === "ENOENT") {
    throw new Error(
      "Could not find .env.example. Run `npm run setup` from the backend folder.",
    );
  }
  throw error;
}

if (!/^JWT_SECRET=.*$/m.test(example)) {
  throw new Error(".env.example is missing the JWT_SECRET setting.");
}

const localEnv = example.replace(
  /^JWT_SECRET=.*$/m,
  `JWT_SECRET=${randomBytes(48).toString("base64url")}`,
);

try {
  await writeFile(envPath, localEnv, { encoding: "utf8", flag: "wx", mode: 0o600 });
  console.log("Created backend/.env with a secure local JWT secret.");
  console.log("Run `npm start` to start the API.");
} catch (error) {
  if (error.code === "EEXIST") {
    console.log("backend/.env already exists; it was not changed.");
    console.log("Run `npm start` to start the API.");
  } else {
    throw error;
  }
}
