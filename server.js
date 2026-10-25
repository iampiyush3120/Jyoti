const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PUBLIC FOLDER
let publicFolder = path.join(__dirname, "public");

if (!fs.existsSync(publicFolder)) {
publicFolder = path.join(__dirname, "Public");
}

console.log("Public folder:", publicFolder);

if (!fs.existsSync(publicFolder)) {
console.error("ERROR: Public folder not found!");
}

// SERVE WEBSITE AND ADMIN FILES
app.use(express.static(publicFolder));
app.use("/admin", express.static(path.join(__dirname, "admin")));

// MYSQL CONNECTION
let db = null;

async function connectDB() {
if (db) return db;


let pool;

try {
    if (
        !process.env.DB_HOST ||
        !process.env.DB_USER ||
        !process.env.DB_PASSWORD ||
        !process.env.DB_NAME
    ) {
        throw new Error("Database environment variables are missing");
    }

    pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            rejectUnauthorized: false
        },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000
    });

    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    db = pool;
    console.log("MySQL connected successfully!");

    return db;
} catch (error) {
    console.error("MySQL connection failed:", error.message);

    if (pool) {
        await pool.end().catch(() => {});
    }

    db = null;
    return null;
}


}

// HOME PAGE
app.get("/", (req, res) => {
const indexPath = path.join(publicFolder, "index.html");


if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
}

return res.status(404).send("index.html not found");


});

// SAVE FORM RESPONSE
app.post("/api/responses", async (req, res) => {
try {
const database = await connectDB();


    if (!database) {
        return res.status(503).json({
            success: false,
            message: "Database is not connected"
        });
    }

    const {
        name,
        phone,
        city,
        rating,
        message,
        latitude,
        longitude,
        answer1,
        answer2,
        answer3
    } = req.body;

    const [columns] = await database.execute(
        "SHOW COLUMNS FROM responses"
    );

    const columnNames = columns.map(column => column.Field);

    const valuesByColumn = {
        name: name ?? "",
        phone: phone ?? "",
        city: city ?? "",
        rating:
            rating !== undefined &&
            rating !== null &&
            rating !== "" &&
            Number.isFinite(Number(rating))
                ? Number(rating)
                : null,
        message: message ?? "",
        latitude:
            latitude !== undefined &&
            latitude !== null &&
            latitude !== "" &&
            Number.isFinite(Number(latitude))
                ? Number(latitude)
                : null,
        longitude:
            longitude !== undefined &&
            longitude !== null &&
            longitude !== "" &&
            Number.isFinite(Number(longitude))
                ? Number(longitude)
                : null,
        answer1: answer1 ?? "",
        answer2: answer2 ?? "",
        answer3: answer3 ?? ""
    };

    const insertColumns = Object.keys(valuesByColumn).filter(
        column => columnNames.includes(column)
    );

    if (insertColumns.length === 0) {
        throw new Error("No matching columns found in responses table");
    }

    const quotedColumns = insertColumns
        .map(column => "`" + column + "`")
        .join(", ");

    const placeholders = insertColumns.map(() => "?").join(", ");

    const values = insertColumns.map(
        column => valuesByColumn[column]
    );

    const sql =
        "INSERT INTO responses (" +
        quotedColumns +
        ") VALUES (" +
        placeholders +
        ")";

    await database.execute(sql, values);

    return res.status(201).json({
        success: true,
        message: "Response saved successfully"
    });
} catch (error) {
    console.error("Error saving response:", error.message);

    return res.status(500).json({
        success: false,
        message: "Failed to save response"
    });
}


});

// GET ALL RESPONSES
app.get("/api/responses", async (req, res) => {
    try {
        const database = await connectDB();

        if (!database) {
            return res.status(503).json({
                success: false,
                message: "Database is not connected"
            });
        }

        const [rows] = await database.execute(
            "SELECT * FROM responses ORDER BY id DESC"
        );

        return res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error getting responses:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to get responses"
        });
    }
});



// HEALTH CHECK
app.get("/health", (req, res) => {
res.json({
status: "OK",
message: "Love Experience server is running"
});
});

// 404 HANDLER
app.use((req, res) => {
res.status(404).json({
success: false,
message: "Route not found"
});
});

// START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
console.log("Love Experience server started");
console.log("Server listening on port " + PORT);
});
