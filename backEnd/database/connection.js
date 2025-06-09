const mongoose = require('mongoose');
const { uri_db } = require('./config');

const connectDB = async () => {
  try {
    await mongoose.connect(uri_db);
    console.log('MongoDB conectado ✅');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;