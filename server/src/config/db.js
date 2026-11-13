import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    console.error(`[Database Tip] Check if MongoDB is running locally or provide a cloud MONGO_URI in server/.env`);
    process.exit(1);
  }
};
