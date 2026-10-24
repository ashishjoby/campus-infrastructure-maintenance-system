const express = require("express");
const cors = require("cors");
const path = require("path");
const { spawn } = require("child_process");
const dotenv = require("dotenv");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  const token = authHeader.slice("Bearer ".length);

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      error: "Authentication is not configured.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token.",
    });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "You do not have permission to perform this action.",
      });
    }

    next();
  };
}
dotenv.config({
  path: path.join(__dirname, ".env"),
});
const pool = require("./db");

const app = express();

const PORT = process.env.PORT || 5000;

// Project root directory
const PROJECT_ROOT = path.join(__dirname, "..");

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,

  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "Campus Infrastructure Maintenance API is running",
  });
});

// ML prediction route
app.post("/api/complaints/predict", (req, res) => {
  const { complaint } = req.body;

  if (!complaint || !complaint.trim()) {
    return res.status(400).json({
      error: "Complaint text is required",
    });
  }
  console.time("Python ML prediction");
  const pythonProcess = spawn("python", ["ml_service.py"], {
    cwd: PROJECT_ROOT,
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
    console.timeEnd("Python ML prediction");
    if (code !== 0) {
      console.error("Python ML service error:", errorOutput);

      return res.status(500).json({
        error: "ML prediction failed",
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
        error: "Invalid response from ML service",
      });
    }
  });

  // Send complaint to Python service
  pythonProcess.stdin.write(complaint);
  pythonProcess.stdin.end();
});

// Create a new complaint
app.post("/api/complaints", authenticateToken, async (req, res) => {
  const { complaint_text, latitude, longitude } = req.body;
  const user_id = req.user.id;
  if (!user_id || !complaint_text || !complaint_text.trim()) {
    return res.status(400).json({
      error: "user_id and complaint_text are required",
    });
  }

  try {
    // Ask the ML service to classify the complaint
    console.time("ml processing");
    const pythonProcess = spawn("python", ["ml_service.py"], {
      cwd: PROJECT_ROOT,
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
      console.timeEnd("ml processing");
      if (code !== 0) {
        console.error("Python ML service error:", errorOutput);

        return res.status(500).json({
          error: "ML prediction failed",
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
          [prediction.department],
        );

        if (departmentResult.rows.length === 0) {
          return res.status(500).json({
            error: "Department not found",
          });
        }

        const departmentId = departmentResult.rows[0].id;

        // Start a database transaction
        const client = await pool.connect();

        try {
          await client.query("BEGIN");

          // Save complaint

          const complaintResult = await client.query(
            `INSERT INTO complaints
   (user_id, complaint_text, category, department_id,
    latitude, longitude, location_description)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   RETURNING *`,
            [
              user_id,
              complaint_text,
              prediction.category,
              departmentId,
              latitude || null,
              longitude || null,
              req.body.location_description || null,
            ],
          );

          // Record the initial complaint status
          await client.query(
            `INSERT INTO status_history
        (complaint_id, status, changed_by)
        VALUES ($1, $2, $3)`,
            [
              complaintResult.rows[0].id,
              complaintResult.rows[0].status,
              user_id,
            ],
          );

          // Commit both operations
          await client.query("COMMIT");

          res.status(201).json({
            message: "Complaint submitted successfully",
            complaint: complaintResult.rows[0],
            prediction: {
              category: prediction.category,
              department: prediction.department,
            },
          });
        } catch (error) {
          // Undo all database changes if anything fails
          await client.query("ROLLBACK");

          console.error("Complaint transaction failed:", error);

          res.status(500).json({
            error: "Failed to save complaint",
          });
        } finally {
          // Return the connection to the pool
          client.release();
        }
      } catch (error) {
        console.error("Complaint processing error:", error);

        res.status(500).json({
          error: "Failed to save complaint",
        });
      }
    });
  } catch (error) {
    console.error("Complaint processing error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to save complaint",
      });
    }
  }
});

// Get all complaints
app.get("/api/complaints", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
                c.id,
                c.complaint_text,
                c.category,
                d.name AS department,
                c.status,
                c.latitude,
                c.longitude,
                c.location_description,
                c.created_at,
                c.updated_at
            FROM complaints c
            JOIN departments d
                ON c.department_id = d.id
            ORDER BY c.created_at DESC`,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch complaints:", error);

    res.status(500).json({
      error: "Failed to fetch complaints",
    });
  }
});

// Get a single complaint by ID
app.get("/api/complaints/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const complaintResult = await pool.query(
      `SELECT
                c.id,
                c.user_id,
                c.complaint_text,
                c.category,
                d.name AS department,
                c.status,
                c.latitude,
                c.longitude,
                c.created_at,
                c.updated_at
            FROM complaints c
            JOIN departments d
                ON c.department_id = d.id
            WHERE c.id = $1`,
      [id],
    );

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({
        error: "Complaint not found",
      });
    }

    const historyResult = await pool.query(
      `SELECT
                sh.id,
                sh.status,
                sh.changed_by,
                sh.changed_at,
                u.name AS changed_by_name
            FROM status_history sh
            LEFT JOIN users u
                ON sh.changed_by = u.id
            WHERE sh.complaint_id = $1
            ORDER BY sh.changed_at ASC`,
      [id],
    );

    res.json({
      complaint: complaintResult.rows[0],
      status_history: historyResult.rows,
    });
  } catch (error) {
    console.error("Failed to fetch complaint:", error);

    res.status(500).json({
      error: "Failed to fetch complaint",
    });
  }
});

// Get staff members by department
app.get("/api/staff/department/:departmentId", async (req, res) => {
  const { departmentId } = req.params;

  try {
    const result = await pool.query(
      `SELECT
                s.id,
                s.name,
                s.email,
                s.department_id,
                d.name AS department
            FROM staff s
            JOIN departments d
                ON s.department_id = d.id
            WHERE s.department_id = $1
            ORDER BY s.name ASC`,
      [departmentId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch department staff:", error);

    res.status(500).json({
      error: "Failed to fetch department staff",
    });
  }
});

// Assign a staff member to a complaint
app.post(
  "/api/complaints/:id/assign",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    const { id } = req.params;
    const { staff_id } = req.body;

    if (!staff_id) {
      return res.status(400).json({
        error: "staff_id is required",
      });
    }

    try {
      // Find the complaint and its department
      const complaintResult = await pool.query(
        `SELECT id, department_id, status
             FROM complaints
             WHERE id = $1`,
        [id],
      );

      if (complaintResult.rows.length === 0) {
        return res.status(404).json({
          error: "Complaint not found",
        });
      }

      const complaint = complaintResult.rows[0];

      // Find the staff member and their department
      const staffResult = await pool.query(
        `SELECT id, name, email, department_id
             FROM staff
             WHERE id = $1`,
        [staff_id],
      );

      if (staffResult.rows.length === 0) {
        return res.status(404).json({
          error: "Staff member not found",
        });
      }

      const staff = staffResult.rows[0];

      // Make sure staff belongs to the complaint's department
      if (staff.department_id !== complaint.department_id) {
        return res.status(400).json({
          error: "Staff member does not belong to the complaint's department",
        });
      }

      // Start transaction
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        // Create the assignment
        const assignmentResult = await client.query(
          `INSERT INTO assignments
                (complaint_id, staff_id)
                VALUES ($1, $2)
                RETURNING *`,
          [id, staff_id],
        );

        // Update complaint status
        const updatedComplaintResult = await client.query(
          `UPDATE complaints
                SET status = 'Assigned',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *`,
          [id],
        );

        // Record status change
        await client.query(
          `INSERT INTO status_history
                (complaint_id, status, changed_by)
                VALUES ($1, $2, $3)`,
          [id, "Assigned", null],
        );

        // Commit all changes
        await client.query("COMMIT");

        res.status(201).json({
          message: "Staff member assigned successfully",
          assignment: assignmentResult.rows[0],
          complaint: updatedComplaintResult.rows[0],
          staff: {
            id: staff.id,
            name: staff.name,
            email: staff.email,
          },
        });
      } catch (error) {
        // Undo all transaction changes if anything fails
        await client.query("ROLLBACK");

        console.error("Assignment transaction failed:", error);

        res.status(500).json({
          error: "Failed to assign staff",
        });
      } finally {
        // Return connection to pool
        client.release();
      }
    } catch (error) {
      console.error("Failed to process staff assignment:", error);

      res.status(500).json({
        error: "Failed to process staff assignment",
      });
    }
  },
);

// Update complaint status
app.patch(
  "/api/complaints/:id/status",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["Pending", "Assigned", "In Progress", "Resolved"];

    if (!status) {
      return res.status(400).json({
        error: "status is required",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid complaint status",
      });
    }

    try {
      // Check whether the complaint exists
      const complaintResult = await pool.query(
        `SELECT id, status
             FROM complaints
             WHERE id = $1`,
        [id],
      );

      if (complaintResult.rows.length === 0) {
        return res.status(404).json({
          error: "Complaint not found",
        });
      }

      // Start transaction
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        // Update complaint status
        const updatedComplaintResult = await client.query(
          `UPDATE complaints
                 SET status = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2
                 RETURNING *`,
          [status, id],
        );

        // Record status change
        await client.query(
          `INSERT INTO status_history
                 (complaint_id, status, changed_by)
                 VALUES ($1, $2, $3)`,
          [id, status, null],
        );

        // Commit both changes
        await client.query("COMMIT");

        res.json({
          message: "Complaint status updated successfully",
          complaint: updatedComplaintResult.rows[0],
        });
      } catch (error) {
        // Undo all changes if anything fails
        await client.query("ROLLBACK");

        console.error("Status update transaction failed:", error);

        res.status(500).json({
          error: "Failed to update complaint status",
        });
      } finally {
        // Return connection to pool
        client.release();
      }
    } catch (error) {
      console.error("Failed to process status update:", error);

      res.status(500).json({
        error: "Failed to process status update",
      });
    }
  },
);

// Upload complaint attachment
app.post(
  "/api/complaints/:id/attachments",
  upload.single("file"),
  async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        error: "Image file is required",
      });
    }

    try {
      // Check whether complaint exists
      const complaintResult = await pool.query(
        `SELECT id
                 FROM complaints
                 WHERE id = $1`,
        [id],
      );

      if (complaintResult.rows.length === 0) {
        return res.status(404).json({
          error: "Complaint not found",
        });
      }

      // Save attachment information
      const attachmentResult = await pool.query(
        `INSERT INTO attachments
                 (complaint_id, file_url, file_type)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
        [id, `/uploads/${req.file.filename}`, req.file.mimetype],
      );

      res.status(201).json({
        message: "Attachment uploaded successfully",
        attachment: attachmentResult.rows[0],
      });
    } catch (error) {
      console.error("Attachment upload failed:", error);

      res.status(500).json({
        error: "Failed to upload attachment",
      });
    }
  },
);

/* Register a student account */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'student')
       RETURNING id, name, email, role, created_at`,
      [name.trim(), normalizedEmail, passwordHash],
    );

    return res.status(201).json({
      message: "Student account created successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      error: "Unable to register account.",
    });
  }
});

/* Log in */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()],
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        error: "Authentication is not configured.",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      error: "Unable to log in.",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
