require('dotenv').config();

const DB_PASSWORD = process.env.DB_PASSWORD;

const uri_db = `mongodb+srv://nicolasgonzalez470:${DB_PASSWORD}@cluster0.zbfn2s4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

module.exports = { uri_db };