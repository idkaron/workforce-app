import mongoose from 'mongoose';
import connectDB from './server/db.js';
import { User } from './server/models/schema.js';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
  await connectDB();
  const u = await User.findOne();
  console.log("User from DB:", u);
  if (u) {
    console.log("toObject():", u.toObject());
  }
  process.exit();
}
test();
