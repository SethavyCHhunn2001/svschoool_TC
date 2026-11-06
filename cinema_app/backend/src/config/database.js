import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI must be set.");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}
