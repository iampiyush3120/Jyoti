const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();

const app = express();

// =====================================
// MIDDLEWARE
// =====================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// =====================================
// PUBLIC FOLDER
// =====================================

let publicFolder = path.join(__dirname, "public");

if (!fs.existsSync(publicFolder)) {
    publicFolder = path.join(__dirname, "Public");
}

console.log("📁 Public folder:", publicFolder);


// =====================================
// SERVE STATIC FILES
// =====================================

app.use(express.static(publicFolder));
app.use("/admin", express.static(path.join(__dirname, "admin")));


// =====================================
// MYSQL CONNECTION
// =====================================

let db = null;

async function connectDB() {
    try {

        db = await mysql.createPool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT || 3306),

            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,

            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Test connection
        const connection = await db.getConnection();

        console.log("=================================");
        console.log("✅ MySQL connected successfully!");
        console.log("📡 Host:", process.env.DB_HOST);
        console.log("🔌 Port:", process.env.DB_PORT || 3306);
        console.log("🗄️ Database:", process.env.DB_NAME);
        console.log("=================================");

        connection.release();

    } catch (error) {

        console.error("=================================");
        console.error("❌ MySQL connection failed!");
        console.error(error.message);
        console.error("=================================");

        db = null;
    }
}

connectDB();


// =====================================
// HOME PAGE
// =====================================

app.get("/", (req, res) => {

    const indexPath = path.join(publicFolder, "index.html");

    if (fs.existsSync(indexPath)) {

        res.sendFile(indexPath);

    } else {

        res.status(404).send("index.html not found");

    }
});


// =====================================
// SAVE RESPONSE
// =====================================

app.post("/api/responses", async (req, res) => {

    try {

        console.log("=================================");
        console.log("📩 New response received:");
        console.log(req.body);
        console.log("=================================");


        // ---------------------------------
        // CHECK DATABASE
        // ---------------------------------

        if (!db) {
            await connectDB();
        }

        if (!db) {

            console.error("❌ Database is not connected");

            return res.status(500).json({
                success: false,
                message: "Database is not connected"
            });

        }


        // ---------------------------------
        // GET FORM DATA
        // ---------------------------------

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


        // ---------------------------------
        // SAFE VALUES
        // ---------------------------------

        const safeName = name || "";
        const safePhone = phone || "";
        const safeCity = city || "";
        const safeRating = (rating !== undefined && rating !== null && rating !== "" && !isNaN(Number(rating))) ? Number(rating) : null;
        const safeMessage = message || "";
        const safeLatitude = (latitude !== undefined && latitude !== null && latitude !== "" && !isNaN(Number(latitude))) ? Number(latitude) : null;
        const safeLongitude = (longitude !== undefined && longitude !== null && longitude !== "" && !isNaN(Number(longitude))) ? Number(longitude) : null;



        // =================================
        // CHECK WHICH COLUMNS EXIST
        // =================================

        const [columns] = await db.execute(
            "SHOW COLUMNS FROM responses"
        );

        const columnNames = columns.map(column => column.Field);


        // =================================
        // BUILD INSERT DYNAMICALLY
        // =================================

        const insertColumns = [];
        const insertValues = [];


        // Name
        if (columnNames.includes("name")) {
            insertColumns.push("name");
            insertValues.push(safeName);
        }


        // Phone
        if (columnNames.includes("phone")) {
            insertColumns.push("phone");
            insertValues.push(safePhone);
        }


        // City
        if (columnNames.includes("city")) {
            insertColumns.push("city");
            insertValues.push(safeCity);
        }


        // Rating
        if (columnNames.includes("rating")) {
            insertColumns.push("rating");
            insertValues.push(safeRating);
        }


        // Message
        if (columnNames.includes("message")) {
            insertColumns.push("message");
            insertValues.push(safeMessage);
        }


        // Latitude
        if (columnNames.includes("latitude")) {
            insertColumns.push("latitude");
            insertValues.push(safeLatitude);
        }


        // Longitude
        if (columnNames.includes("longitude")) {
            insertColumns.push("longitude");
            insertValues.push(safeLongitude);
        }


        // Answer 1
        if (columnNames.includes("answer1")) {
            insertColumns.push("answer1");
            insertValues.push(answer1 || "");
        }


        // Answer 2
        if (columnNames.includes("answer2")) {
            insertColumns.push("answer2");
            insertValues.push(answer2 || "");
        }


        // Answer 3
        if (columnNames.includes("answer3")) {
            insertColumns.push("answer3");
            insertValues.push(answer3 || "");
        }


        // =================================
        // CHECK COLUMNS
        // =================================

        if (insertColumns.length === 0) {

            throw new Error(
                "No matching columns found in responses table"
            );

        }


        // =================================
        // CREATE SQL
        // =================================

        const placeholders = insertColumns
            .map(() => "?")
            .join(", ");

        const sql = `
            INSERT INTO responses
            (${insertColumns.join(", ")})
            VALUES (${placeholders})
        `;


        console.log("📝 SQL:", sql);


        // =================================
        // INSERT INTO DATABASE
        // =================================

        await db.execute(sql, insertValues);


        console.log("=================================");
        console.log("✅ Response saved to MySQL!");
        console.log("=================================");


        // =================================
        // SUCCESS RESPONSE
        // =================================

        res.status(201).json({

            success: true,

            message: "Response saved successfully"

        });


    } catch (error) {

        console.error("=================================");
        console.error("❌ Error saving response:");
        console.error(error.message);
        console.error("=================================");


        res.status(500).json({

            success: false,

            message: "Failed to save response",

            error: error.message

        });

    }

});


// =====================================
// GET ALL RESPONSES
// =====================================

app.get("/api/responses", async (req, res) => {

    try {

        if (!db) {
            await connectDB();
        }

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

            message: "Failed to get responses",

            error: error.message

        });

    }

});


// =====================================
// HEALTH CHECK
// =====================================

app.get("/health", (req, res) => {

    res.json({

        status: "OK",

        message: "Love Experience server is running ❤️"

    });

});


// =====================================
// 404 HANDLER
// =====================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message: "Route not found"

    });

});


// =====================================
// START SERVER
// =====================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

    console.log("=================================");
    console.log("❤️ Love Experience Server Started");
    console.log(`🚀 Port: ${PORT}`);
    console.log("=================================");

});