require("dotenv").config();
const express = require("express");

const userRouter = require("./routes/user");
const personRouter = require("./routes/person");

const db = require("./db");

const app = express();
const port = 3000;

app.use(express.json());
app.use("/login", userRouter);
app.use("/person", personRouter);

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});

module.exports = db;
