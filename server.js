const express = require("express");
const path = require("path");
const db = require("./db");
const usersRouter = require("./services/users/users"); // Import the users service
const cors = require("cors");

const app = express();
const PORT = process.env.PORT;

app.use(cors());

// Middleware for parsing JSON requests
app.use(express.json());

// Serve static files for uploaded images (optional for serving uploaded files)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Use the users routes
app.use("/api/users", usersRouter);

// Test route
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.send(
      `Database connected successfully. Server time: ${result.rows[0].now}`
    );
  } catch (error) {
    console.error("Error connecting to the database:", error);
    res.status(500).send("Database connection failed.");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
