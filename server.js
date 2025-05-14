require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const app = express();
const port = 3000;
app.use(express.json());

const TOKEN_SECRET = process.env.TOKEN_SECRET;

// Token-Check Middleware
const checkAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).send("Token fehlt");

  try {
    const token = auth.split(" ")[1];
    req.user = jwt.verify(token, TOKEN_SECRET);
    next();
  } catch {
    res.status(403).send("Token ungültig");
  }
};

// Token erstellen
function generateAccessToken(username) {
  return jwt.sign(username, TOKEN_SECRET, { expiresIn: "1h" });
}

// AJV & Schema-Validierung
const ajv = new Ajv();
addFormats(ajv);

const personSchema = {
  type: "object",
  properties: {
    vorname: { type: "string" },
    nachname: { type: "string" },
    plz: { type: "string" },
    strasse: { type: "string" },
    ort: { type: "string" },
    telefonnummer: { type: "string" },
    email: { type: "string", format: "email" }
  },
  required: ["vorname", "nachname", "email"],
  additionalProperties: false
};

const validatePerson = ajv.compile(personSchema);

// H4 Verbindungspool
const db = mysql.createPool({
  host: "10.115.2.21",
  user: "root",
  password: "12345678",
  database: "SWP",
  waitForConnections: true,
  connectionLimit: 10,
}).promise();

app.post("/login", async (req, res) => {
 const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Username oder Passwort fehlt");

  try {
    const [rows] = await db.execute("SELECT * FROM user WHERE username = ? AND password = ?", [username, password]);
    if (rows.length === 0) return res.status(401).send("Falsche Login-Daten");

    const token = generateAccessToken({ username });
    res.json({ token });
  } catch (err) {
    res.status(500).send("DB-Fehler");
  }
});

// POST /person
app.post("/person", checkAuth, async (req, res) => {
  const valid = validatePerson(req.body);
  if (!valid) return res.status(400).json({ errors: validatePerson.errors });

  const { vorname, nachname, plz, strasse, ort, telefonnummer, email } = req.body;
  try {
    const [result] = await db.execute(
      `INSERT INTO personen (vorname, nachname, plz, strasse, ort, telefonnummer, email) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [vorname, nachname, plz, strasse, ort, telefonnummer, email]
    );
    res.status(201).json({ message: "Person hinzugefügt", id: result.insertId });
  } catch (err) {
    console.error("Fehler beim Einfügen:", err);
    res.status(500).send("DB-Fehler");
  }
});

// GET /person (alle)
app.get("/person", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM personen");
    res.json(rows);
  } catch {
    res.status(500).send("DB-Fehler");
  }
});

// GET /person/:id (einzelne)
app.get("/person/:id", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM personen WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).send("Nicht gefunden");
    res.json(rows[0]);
  } catch {
    res.status(500).send("DB-Fehler");
  }
});

// DELETE /person/:id
app.delete("/person/:id", checkAuth, async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM personen WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).send("Nicht gefunden");
    res.send("Person gelöscht");
  } catch {
    res.status(500).send("DB-Fehler");
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
