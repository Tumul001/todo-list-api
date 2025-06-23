-- SQL script to set up the Todo database
-- Run this in psql or your PostgreSQL client

-- Create the database (run this first)
CREATE DATABASE todoapp;

-- Connect to the todoapp database and run the rest
\c todoapp;

-- Create the todos table
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data (optional)
INSERT INTO todos (title, description, priority) VALUES
('Setup API project', 'Complete the Todo API setup and testing', 'high'),
('Learn PostgreSQL', 'Study PostgreSQL database operations', 'medium'),
('Deploy to Render', 'Deploy the API to Render platform', 'high'),
('Write documentation', 'Create comprehensive API documentation', 'low');

-- Display the created table
\d todos;

-- Show sample data
SELECT * FROM todos;
