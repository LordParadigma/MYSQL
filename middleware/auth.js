const jwt = require("jsonwebtoken");
const TOKEN_SECRET = process.env.TOKEN_SECRET;

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

module.exports = { checkAuth };
