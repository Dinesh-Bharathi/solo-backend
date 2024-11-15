const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

pool.on("connect", () => {
  console.log("Connected to the PostgreSQL database.");
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};