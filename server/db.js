import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in the .env file');
    }
    
    // Check if it's the placeholder URI
    if (uri.includes('<username>') || uri.includes('<password>')) {
      console.error('\n=============================================================');
      console.error('⚠️  ACTION REQUIRED:');
      console.error('Please update the MONGO_URI in your .env file with your');
      console.error('actual MongoDB Atlas username, password, and cluster details.');
      console.error('=============================================================\n');
      process.exit(1);
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
