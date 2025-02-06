const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

// Your solution should be written here
const jwt = require("jsonwebtoken");

const SECRET_KEY = "JWsdgskdhf3rhbdjgf4DshdcSDF_*Dwuiegfc";
const users = {};
const highScores = [];

// Middleware to validate JWT
function authenticateToken(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized, JWT token missing" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(401).json({ message: "Unauthorized, invalid JWT token" });

    req.user = user;
    next();
  });
}

// API 1: Register a new user
app.post("/signup", (req, res) => {
  const { userHandle, password } = req.body;
  //console.log("Request received:", req.body);

  // Check for invalid request
  if (!userHandle || !password) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  // Check if the userHandle and password is less than 6 chars
  if (userHandle.length < 6) {
    return res.status(400).json({ message: "UserHandle must be at least 6 characters long" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  users[userHandle] = { userHandle, password };
  res.status(201).json({ message: "User registered successfully" });
});

// API 2: Login and generate JWT
app.post("/login", (req, res) => {
  const { userHandle, password, ...extraFields } = req.body;
  //console.log("Request received:", req.body);

  // If there are unexpected fields, reject the request
  if (Object.keys(extraFields).length > 0) {
    return res.status(400).json({ message: "Unexpected fields in request body" });
  }

  // Check of the data type of userHandle and password 
  if (typeof userHandle !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid data type for userHandle or password" });
  }

  if (!userHandle || !password) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  const user = users[userHandle];
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Unauthorized, incorrect username or password" });
  }

  const token = jwt.sign({ userHandle }, SECRET_KEY, { expiresIn: "1h" });
  res.status(200).json({ jsonWebToken: token });
});

// API 3: Post a high score (Protected with JWT)
app.post("/high-scores", authenticateToken, (req, res) => {
  const { level, userHandle, score, timestamp } = req.body;

  // Check for invalid request
  if (!level || !userHandle || typeof score !== "number" || !timestamp) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  if (req.user.userHandle !== userHandle) {
    return res.status(401).json({ message: "Unauthorized, userHandle mismatch" });
  }

  highScores.push({ level, userHandle, score, timestamp });
  res.status(201).json({ message: "High score posted successfully" });
});

// API 4: Get high scores with pagination
app.get("/high-scores", (req, res) => {
  const { level, page = 1 } = req.query;

  if (!level) {
    return res.status(400).json({ message: "Level is required" });
  }

  const filteredScores = highScores
    .filter((entry) => entry.level === level)
    .sort((a, b) => b.score - a.score) // Ensure highest scores come first
    .slice((page - 1) * 20, page * 20); // Pagination (20 per page)

  res.status(200).json(filteredScores);
});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
