const express = require("express");
const db = require("../db");
const { checkAuth } = require("../middleware/auth");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const router = express.Router();
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

// Hilfsfunktion zur ID-Validierung
function isValidId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0;
}

router.post("/", checkAuth, async (req, res) => {
  const valid = validatePerson(req.body);
  if (!valid) {
    return res.status(400).json({ message: validatePerson.errors, message_code: 1 });
  }

  const { vorname, nachname, plz, strasse, ort, telefonnummer, email } = req.body;
  try {
    const [result] = await db.execute(
      `INSERT INTO personen (vorname, nachname, plz, strasse, ort, telefonnummer, email)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [vorname, nachname, plz, strasse, ort, telefonnummer, email]
    );
    res.status(201).json({ message: "Person hinzugefügt", message_code: 0, id: result.insertId });
  } catch (err) {
    console.error("DB-Fehler:", err);
    res.status(500).json({ message: "DB-Fehler", message_code: 1 });
  }
});

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM personen");
    res.json(rows);
  } catch (err) {
    console.error("DB-Fehler:", err);
    res.status(500).json({ message: "DB-Fehler", message_code: 1 });
  }
});

router.get("/:id", async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: "Ungültige ID – nur positive Ganzzahlen erlaubt", message_code: 1 });
  }

  try {
    const [rows] = await db.execute("SELECT * FROM personen WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Person nicht gefunden", message_code: 1 });
    res.json(rows[0]);
  } catch (err) {
    console.error("DB-Fehler:", err);
    res.status(500).json({ message: "DB-Fehler", message_code: 1 });
  }
});

router.delete("/:id", checkAuth, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: "Ungültige ID – nur positive Ganzzahlen erlaubt", message_code: 1 });
  }

  try {
    const [result] = await db.execute("DELETE FROM personen WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Person nicht gefunden", message_code: 1 });
    res.json({ message: "Person gelöscht" });
  } catch (err) {
    console.error("DB-Fehler:", err);
    res.status(500).json({ message: "DB-Fehler", message_code: 1 });
  }
});

module.exports = router;
