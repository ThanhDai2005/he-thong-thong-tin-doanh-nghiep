import mongoose from "mongoose";
import logger from "./logger.js";

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    logger.logInfo("Connect Success!");
  } catch (error) {
    logger.logError("Connect Error!");
  }
};

export default connect;
