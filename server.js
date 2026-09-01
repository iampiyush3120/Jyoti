const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ===============================
// PUBLIC FOLDER
// ===============================

// Check both "public" and "Public"
let publicFolder = path.join(__dirname, "public");

if (!fs.existsSync(publicFolder)) {
    publicFolder = path.join(__dirname, "Public");
}

// Serve HTML, CSS, JS, images, music etc.
app.use(express.static(publicFolder));


// ===============================
// MYSQL CONNECTION
// ===============================

let db;

async function connectDB() {
    try {
        db = await mysql.createPool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,

            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Test connection
        const connection = await db.getConnection();
        console.log("✅ MySQL connected successfully!");
        connection.release();

    } catch (error) {
        console.error("❌ MySQL connection failed:");
        console.error(error.message);
    }
}

connectDB();


// ===============================
// HOME PAGE
// ===============================

app.get("/", (req, res) => {
    const indexPath = path.join(publicFolder, "index.html");

    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("index.html not found");
    }
});


// ===============================
// SAVE RESPONSE
// ===============================

app.post("/api/responses", async (req, res) => {

    try {

        const {
            name,
            phone,
            city,
            rating,
            message,
            latitude,
            longitude
        } = req.body;

        console.log("📩 New response received:");
        console.log(req.body);

        if (!db) {
            return res.status(500).json({
                success: false,
                message: "Database is not connected"
            });
        }

        // Insert response
        const sql = `
            INSERT INTO responses
            (name, phone, city, rating, message, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await db.execute(sql, [
            name || null,
            phone || null,
            city || null,
            rating || null,
            message || null,
            latitude || null,
            longitude || null
        ]);

        console.log("✅ Response saved to MySQL!");

        res.status(201).json({
            success: true,
            message: "Response saved successfully"
        });

    } catch (error) {

        console.error("❌ Error saving response:");
        console.error(error.message);

        res.status(500).json({
            success: false,
            message: "Failed to save response",
            error: error.message
        });
    }
});


// ===============================
// GET ALL RESPONSES
// ===============================

app.get("/api/responses", async (req, res) => {

    try {

        if (!db) {
            return res.status(500).json({
                success: false,
                message: "Database is not connected"
            });
        }

        const [rows] = await db.execute(
            "SELECT * FROM responses ORDER BY id DESC"
        );

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error("❌ Error getting responses:");
        console.error(error.message);

        res.status(500).json({
            success: false,
            message: "Failed to get responses"
        });
    }
});


// ===============================
// HEALTH CHECK
// ===============================

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Love Experience server is running ❤️"
    });
});


// ===============================
// PORT
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("=================================");
    console.log("❤️ Love Experience Server Started");
    console.log(`🚀 Port: ${PORT}`);
    console.log("=================================");
});