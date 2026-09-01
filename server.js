require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
const PORT = 3000;

// =========================
// Middleware
// =========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// =========================
// Frontend
// =========================

app.use(express.static(path.join(__dirname, "public")));


// =========================
// MySQL Connection
// =========================

const db = mysql.createConnection({

    host: process.env.DB_HOST,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME

});


// =========================
// MySQL Connect
// =========================

db.connect((err) => {

    if (err) {

        console.log(
            "❌ MySQL connection failed:",
            err.message
        );

    } else {

        console.log(
            "✅ MySQL connected successfully!"
        );

    }

});


// =========================
// Home Page
// =========================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// =========================
// SAVE RESPONSE
// =========================

app.post("/api/responses", (req, res) => {

    console.log("📥 Data received:", req.body);


    const {

        name,

        phone,

        answer1,

        answer2,

        message,

        latitude,

        longitude

    } = req.body;


    // =========================
    // Required Fields
    // =========================

    if (!name) {

        return res.status(400).json({

            success: false,

            message: "Name is required."

        });

    }


    if (!phone) {

        return res.status(400).json({

            success: false,

            message: "Phone number is required."

        });

    }


    if (!answer1) {

        return res.status(400).json({

            success: false,

            message: "Question 1 answer is required."

        });

    }


    if (!answer2) {

        return res.status(400).json({

            success: false,

            message: "Final question answer is required."

        });

    }


    if (
        latitude === undefined ||
        latitude === null ||
        longitude === undefined ||
        longitude === null
    ) {

        return res.status(400).json({

            success: false,

            message: "Location is required."

        });

    }


    // =========================
    // Phone Validation
    // =========================

    if (!/^[6-9][0-9]{9}$/.test(phone)) {

        return res.status(400).json({

            success: false,

            message:
                "Please enter a valid 10-digit phone number."

        });

    }


    // =========================
    // SQL
    // =========================

    const sql = `

        INSERT INTO responses

        (

            name,

            phone,

            answer1,

            answer2,

            message,

            latitude,

            longitude

        )

        VALUES (?, ?, ?, ?, ?, ?, ?)

    `;


    db.query(

        sql,

        [

            name,

            phone,

            answer1,

            answer2,

            message || null,

            latitude,

            longitude

        ],

        (err, result) => {


            if (err) {

                console.log(
                    "❌ Database error:",
                    err.message
                );


                return res.status(500).json({

                    success: false,

                    message:
                        "Failed to save response."

                });

            }


            console.log(
                "❤️ Response saved! ID:",
                result.insertId
            );


            res.json({

                success: true,

                message:
                    "Your response has been saved ❤️"

            });

        }

    );

});


// =========================
// Start Server
// =========================

app.listen(PORT, () => {

    console.log(
        `🚀 Server running at http://localhost:${PORT}`
    );

});