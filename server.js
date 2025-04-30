const express = require("express");
const mysql = require("mysql2");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const app = express();
const port = 3000;

// AJV + Formats
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

// DB-Verbindung
const db = mysql.createConnection({
  host: "10.115.2.21",
  user: "root",
  password: "12345678",
  database: "SWP",
});

db.connect((err) => {
  if (err) {
    console.error("Datenbankverbindung fehlgeschlagen:", err);
    process.exit(1);
  }
  console.log("Mit DB verbunden!");
});

app.use(express.json());

// GET /hello mit Query
app.get("/hello", (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).send("Name fehlt");

  db.query(
    "INSERT INTO greetings (name, source) VALUES (?, ?)",
    [name, "query"],
    (err) => {
      if (err) return res.status(500).send("Fehler beim Einfügen in die DB");
      res.send("hallo mein query ist: " + name);
    }
  );
});

// GET /hello/:name
app.get("/hello/:name", (req, res) => {
  const name = req.params.name;

  db.query(
    "INSERT INTO greetings (name, source) VALUES (?, ?)",
    [name, "param"],
    (err) => {
      if (err) return res.status(500).send("Fehler beim Einfügen in die DB");
      res.send("hallo mein Name ist auch " + name);
    }
  );
});

// POST /hello/body
app.post("/hello/body", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send("JSON muss ein 'name'-Feld enthalten");

  db.query(
    "INSERT INTO greetings (name, source) VALUES (?, ?)",
    [name, "body"],
    (err) => {
      if (err) return res.status(500).send("Fehler beim Einfügen in die DB");
      res.send({ message: "Name gespeichert", name });
    }
  );
});

// POST /person mit AJV-Validierung
app.post("/person", (req, res) => {
  const valid = validatePerson(req.body);
  if (!valid) return res.status(400).json({ errors: validatePerson.errors });

  const { vorname, nachname, plz, strasse, ort, telefonnummer, email } = req.body;

  const query = `
    INSERT INTO personen (vorname, nachname, plz, strasse, ort, telefonnummer, email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [vorname, nachname, plz, strasse, ort, telefonnummer, email];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Fehler beim Einfügen der Person:", err);
      return res.status(500).send("Fehler beim Speichern der Person");
    }
    res.status(201).send({ message: "Person hinzugefügt", id: result.insertId });
  });
});

// GET /person – alle Personen
app.get("/person", (req, res) => {
  db.query("SELECT * FROM personen", (err, results) => {
    if (err) return res.status(500).send("Fehler beim Abrufen der Personen");
    res.status(200).json(results);
  });
});

// GET /person/:id – einzelne Person
app.get("/person/:id", (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM personen WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).send("Fehler beim Abrufen der Person");
    if (result.length === 0) return res.status(404).send("Person nicht gefunden");
    res.status(200).json(result[0]);
  });
});

// DELETE /person/:id
app.delete("/person/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM personen WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).send("Fehler beim Löschen der Person");
    if (result.affectedRows === 0) return res.status(404).send("Person nicht gefunden");
    res.status(200).send("Person gelöscht");
  });
});

app.listen(port, () => {
  console.log(`Server läuft unter http://localhost:${port}`);
});
