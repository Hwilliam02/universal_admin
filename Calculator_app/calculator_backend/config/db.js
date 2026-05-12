import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/calculator_db';

const dbConnect = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Calculator DB connected:', MONGO_URI);
  } catch (err) {
    console.error('❌ Calculator DB connection failed:', err.message);
    process.exit(1);
  }
};

export default dbConnect;
