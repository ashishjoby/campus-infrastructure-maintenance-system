-- ============================================
-- Campus Grievance System Database Schema
-- ============================================

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Departments
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);


-- Complaints
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    complaint_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    department_id INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_complaint_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_complaint_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
);


-- Staff
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    department_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_staff_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
);


-- Assignments
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL,
    staff_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignment_complaint
        FOREIGN KEY (complaint_id)
        REFERENCES complaints(id),

    CONSTRAINT fk_assignment_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff(id)
);


-- Status History
CREATE TABLE status_history (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL,
    changed_by INTEGER,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_status_complaint
        FOREIGN KEY (complaint_id)
        REFERENCES complaints(id),

    CONSTRAINT fk_status_user
        FOREIGN KEY (changed_by)
        REFERENCES users(id)
);


-- Attachments
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attachment_complaint
        FOREIGN KEY (complaint_id)
        REFERENCES complaints(id)
);