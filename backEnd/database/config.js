require('dotenv').config();

const DB_PASSWORD = process.env.DB_PASSWORD
const DB_USER = process.env.DB_USER;

const uri_db = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.zbfn2s4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
//const uri_db = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.zbfn2s4.mongodb.net/`;
module.exports = { uri_db };