import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/texcycle_ai';

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[db] MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
