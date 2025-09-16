import mongoose from "mongoose";

const connectDB = async (mongoUri) => {
  try {
    const conn = await mongoose.connect(mongoUri, {
      // options หากต้องการ (mongoose 7+ ไม่จำเป็นต้องใส่ options หลัก)
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

export default connectDB;
