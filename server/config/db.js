const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || mongoUri === 'mongodb://localhost:27017/connectserve') {
      try {
        await mongoose.connect(mongoUri || 'mongodb://localhost:27017/connectserve', {
          serverSelectionTimeoutMS: 2000,
        });
        console.log(`[Database] MongoDB Connected: ${mongoose.connection.host}`);
        return;
      } catch (localErr) {
        console.log('[Database] Local MongoDB not detected. Starting in-memory Mongo server for development/demo...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        mongoUri = memoryServer.getUri();
      }
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host} (${mongoUri.includes('127.0.0.1') || mongoUri.includes('memory') ? 'In-Memory/Local' : 'Remote Atlas'})`);
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
  } catch (error) {
    console.error('Error disconnecting DB:', error);
  }
};

module.exports = { connectDB, disconnectDB };
