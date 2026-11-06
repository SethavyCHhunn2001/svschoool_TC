import "dotenv/config";
import app from "./src/app.js";
import { connectDatabase } from "./src/config/database.js";

const port = Number(process.env.PORT || 3000);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET is missing or too short. From the backend folder, run `npm run setup` to create a local .env with a secure random secret, then run `npm start` again. For production, set JWT_SECRET in your deployment environment.",
  );
}

await connectDatabase();
app.listen(port, () => {
  console.log(`Cinema API listening on port ${port}`);
});
