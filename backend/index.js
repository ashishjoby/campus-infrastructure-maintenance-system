const express = require("express");
const cors = require("cors");
const path = require("path");
const { spawn } = require("child_process");
const dotenv=require("dotenv");

dotenv.config({
    path: path.join(__dirname, ".env")
});
const pool = require("./db");

const app = express();

const PORT = process.env.PORT || 5000;

// Project root directory
const PROJECT_ROOT = path.join(__dirname, "..");

// Middleware
app.use(cors());
app.use(express.json());


// Health check route
app.get("/", (req, res) => {
    res.json({
        message: "Campus Infrastructure Maintenance API is running"
    });
});


// ML prediction route
app.post("/api/complaints/predict", (req, res) => {
    const { complaint } = req.body;

    if (!complaint || !complaint.trim()) {
        return res.status(400).json({
            error: "Complaint text is required"
        });
    }

    const pythonProcess = spawn("python", ["ml_service.py"], {
        cwd: PROJECT_ROOT
    });

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
        if (code !== 0) {
            console.error("Python ML service error:", errorOutput);

            return res.status(500).json({
                error: "ML prediction failed"
            });
        }

        try {
            const result = JSON.parse(output);

            if (result.error) {
                return res.status(400).json(result);
            }

            res.json(result);
        } catch (error) {
            console.error("Invalid ML response:", output);

            res.status(500).json({
                error: "Invalid response from ML service"
            });
        }
    });

    // Send complaint to Python service
    pythonProcess.stdin.write(complaint);
    pythonProcess.stdin.end();
});


// Create a new complaint
app.post("/api/complaints", async (req, res) => {
    const {
        user_id,
        complaint_text,
        latitude,
        longitude
    } = req.body;

    if (!user_id || !complaint_text || !complaint_text.trim()) {
        return res.status(400).json({
            error: "user_id and complaint_text are required"
        });
    }

    try {
        // Ask the ML service to classify the complaint
        const pythonProcess = spawn("python", ["ml_service.py"], {
            cwd: PROJECT_ROOT
        });

        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.stdin.write(complaint_text);
        pythonProcess.stdin.end();

        pythonProcess.on("close", async (code) => {
            if (code !== 0) {
                console.error("Python ML service error:", errorOutput);

                return res.status(500).json({
                    error: "ML prediction failed"
                });
            }

            try {
                const prediction = JSON.parse(output);

                if (prediction.error) {
                    return res.status(400).json(prediction);
                }

                // Find department ID
                const departmentResult = await pool.query(
                    "SELECT id FROM departments WHERE name = $1",
                    [prediction.department]
                );

                if (departmentResult.rows.length === 0) {
                    return res.status(500).json({
                        error: "Department not found"
                    });
                }

                const departmentId = departmentResult.rows[0].id;

                // Save complaint
                const complaintResult = await pool.query(
                    `INSERT INTO complaints
                    (user_id, complaint_text, category, department_id, latitude, longitude)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *`,
                    [
                        user_id,
                        complaint_text,
                        prediction.category,
                        departmentId,
                        latitude || null,
                        longitude || null
                    ]
                );
                // Record the initial complaint status
await pool.query(
    `INSERT INTO status_history
    (complaint_id, status, changed_by)
    VALUES ($1, $2, $3)`,
    [
        complaintResult.rows[0].id,
        complaintResult.rows[0].status,
        user_id
    ]
);
                res.status(201).json({
                    message: "Complaint submitted successfully",
                    complaint: complaintResult.rows[0],
                    prediction: {
                        category: prediction.category,
                        department: prediction.department
                    }
                });

            } catch (error) {
                console.error("Complaint processing error:", error);

                res.status(500).json({
                    error: "Failed to save complaint"
                });
            }
        });

    } catch (error) {
        console.error("Complaint submission error:", error);

        res.status(500).json({
            error: "Complaint submission failed"
        });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});