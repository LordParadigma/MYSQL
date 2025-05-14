const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");
const router = express.Router();

const TOKEN_SECRET = process.env.TOKEN_SECRET;

function generateAccessToken(username) {
  return jwt.sign(username, TOKEN_SECRET, { expiresIn: "1h" });
}

router.post("/", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Username oder Passwort fehlt");

  try {
    console.log(db);
    const [rows] = await db.execute(
      "SELECT * FROM user WHERE username = ? AND password = ?",
      [username, password]
    );
    if (rows.length === 0) return res.status(401).send("Falsche Login-Daten");

    const token = generateAccessToken({ username });
    res.json({ token });
  } catch (err) {
    console.error("DB-Fehler:", err);
    res.status(500).send("DB-Fehler");
  }
});

module.exports = router;
