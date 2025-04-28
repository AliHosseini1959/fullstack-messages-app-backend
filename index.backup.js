const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require('dotenv').config(); // Load environment variables from .env file
const app = express();
app.use(cors());
app.use(express.json());

// Replace with your actual database URL from Render
const db = new Pool({
  connectionString: process.env.DATABASE_URL, // Store this in .env
  ssl: {
    rejectUnauthorized: false,
  },
});

/*app.get("/check-user/:email", async (req, res) => {
  const email = req.params.email;
  console.log("Check", email);
  try {
    const result = await db.query(
      "SELECT 1 FROM messages WHERE useremail = $1 LIMIT 1",
      [email]
    );
    if (result.rows.length > 0) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error("Error checking user:", err);
    res.status(500).json({ error: "Error checking user" });
  }
});*/

app.post("/check-user", async (req, res) => {
  const { userEmail } = req.body; // Get email from the request body
console.log(userEmail);
  try {
    const result = await db.query(
      "SELECT * FROM messages WHERE useremail = $1", // Query the database to find the user by email
      [userEmail]
    );

    if (result.rows.length > 0) {
      // If user exists
      return res.json({ exists: true });
    } else {
      // If user does not exist
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error('Error checking user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});





// GET all messages
app.get("/messages", async (req, res) => {
  //console.log("app.get");
  //const { userEmail } = req.body;
  const userEmail = req.query.userEmail;
  console.log(`userEmail :{$userEmail}`);
  if (!userEmail) return res.status(400).json({ error: "userEmail is required" });
  //console.log("userEmail", userEmail);

  try {
    const result = await db.query("SELECT * FROM messages WHERE useremail = $1", [userEmail]);
    res.json(result.rows);
    //console.log(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});


// POST a new message
app.post("/messages", async (req, res) => {
  //console.log("post")
  const { userEmail, message } = req.body;
  //console.log("userEmail ", userEmail, "message: ", message)
  
  if (!userEmail || !message) return res.status(400).json({ error: "userEmail and message required" });
  //console.log("Post:", userEmail, message)
  try {
    const result = await db.query(
      "INSERT INTO messages (userEmail, message) VALUES ($1, $2) RETURNING *",
      [userEmail, message]
    );
    //console.log(result);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add message" });
  }
});
// DELETE one message
app.delete("/messages/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM messages WHERE id = $1", [id]);
    res.status(204).end(); // success, no content
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// DELETE all messages
app.delete("/messages", async (req, res) => {
  try {
    await db.query("DELETE FROM messages");
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete all messages" });
  }
});
app.post("/delete-messages", async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No message IDs provided" });
  }

  try {
    await db.query("DELETE FROM messages WHERE id = ANY($1::int[])", [ids]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete messages" });
  }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
