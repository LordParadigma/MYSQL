const mysql = require("mysql2");

const db = mysql.createPool({
  host: "10.115.2.21",
  user: "root",
  password: "12345678",
  database: "SWP",
  waitForConnections: true,
  connectionLimit: 10,
}).promise();

module.exports = db;
