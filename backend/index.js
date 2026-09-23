const express = require("express");
const cors = require("cors");
const path = require("path");
const { spawn } = require("child_process");
require("dotenv").config();

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


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});