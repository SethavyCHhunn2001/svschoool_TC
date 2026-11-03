import "dotenv/config";
import app from "./src/app.js";
import connectDatabase from "./src/config/database.js";

const port = Number(process.env.PORT || 4000);

try {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`SV High School API listening on port ${port}`);
  });
} catch (error) {
  console.error("Unable to start API:", error.message);
  process.exitCode = 1;
}
