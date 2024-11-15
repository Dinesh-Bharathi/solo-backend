const express = require("express");
const db = require("../../db");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// Set up multer for temporary file storage
const upload = multer({ dest: "temp/" }); // Temporarily store files in the 'temp' folder

// API to fetch all users with image links
router.get("/all", async (req, res) => {
  try {
    const query = `
      SELECT 
        useruuid,
        username,
        email,
        phone,
        password,
        profileimage,
        profilebackground,
        created_at,
        updated_at
      FROM users;
    `;

    const result = await db.query(query);

    // Transform the result to include image URLs or null
    const users = result.rows.map((user) => ({
      ...user,
      profileImageUrl: user.profileimage
        ? `http://localhost:5000/api/users/image/${user.useruuid}/profileimage`
        : null,
      profileBackgroundUrl: user.profilebackground
        ? `http://localhost:5000/api/users/image/${user.useruuid}/profilebackground`
        : null,
    }));

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Error fetching users.");
  }
});

// Add user API with image binary storage
router.post(
  "/add",
  upload.fields([
    { name: "profileimage", maxCount: 1 },
    { name: "profilebackground", maxCount: 1 },
  ]),
  async (req, res) => {
    const tempFiles = [];
    try {
      // Generate a unique UUID
      const userUUID = uuidv4().slice(0, 8);
      console.log("userUUID", userUUID);

      // Extract user data from the request body
      const { username, email, phone, password } = req.body;

      // Validate required fields
      if (!username || !email || !phone || !password) {
        return res.status(400).json({
          message:
            "All fields are required: username, email, phone, and password.",
        });
      }

      // Read files as binary data
      const profileImage = req.files["profileimage"]
        ? fs.readFileSync(req.files["profileimage"][0].path)
        : null;
      const profileBackground = req.files["profilebackground"]
        ? fs.readFileSync(req.files["profilebackground"][0].path)
        : null;

      // Track temp files for cleanup
      if (req.files["profileimage"])
        tempFiles.push(req.files["profileimage"][0].path);
      if (req.files["profilebackground"])
        tempFiles.push(req.files["profilebackground"][0].path);

      // Insert user data into the database
      const query = `
        INSERT INTO users (useruuid, username, email, phone, password, profileimage, profilebackground)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
      `;
      const values = [
        userUUID,
        username,
        email,
        phone,
        password, // Store password as is (not hashed as per your preference)
        profileImage,
        profileBackground,
      ];

      const result = await db.query(query, values);

      // Send response with created user details
      res.status(201).json({
        message: "User created successfully!",
        user: result.rows[0],
      });
    } catch (error) {
      console.error("Error creating user:", error);

      // Handle unique constraint violations
      if (error.code === "23505") {
        return res.status(400).json({
          message: "Duplicate entry detected.",
          error: error.message,
        });
      }

      res.status(500).send("Error creating user.");
    } finally {
      // Clean up temporary files
      tempFiles.forEach((file) => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
    }
  }
);

// API to fetch user image
router.get("/image/:useruuid/:type", async (req, res) => {
  const { useruuid, type } = req.params;

  try {
    // Validate the type to prevent SQL injection
    if (!["profileimage", "profilebackground"].includes(type)) {
      return res.status(400).send("Invalid type.");
    }

    // Query the database for the image
    const query = `SELECT ${type} FROM users WHERE useruuid = $1`;
    const result = await db.query(query, [useruuid]);

    if (result.rows.length === 0 || !result.rows[0][type]) {
      return res.status(404).send("Image not found.");
    }

    // Assume profileimage is PNG, profilebackground could be PNG/JPEG, etc.
    let contentType = "image/png"; // Default to PNG

    // You can dynamically check the type of image or set specific content types here
    if (type === "profileimage") {
      contentType = "image/png"; // Adjust to correct format if necessary
    } else if (type === "profilebackground") {
      contentType = "image/jpeg"; // Adjust if background images are JPEG, for example
    }

    // Set the content type dynamically
    res.setHeader("Content-Type", contentType);

    // Send the image data
    res.send(result.rows[0][type]);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).send("Error fetching image.");
  }
});

module.exports = router;
