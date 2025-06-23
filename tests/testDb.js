const { Pool } = require('pg');
require('dotenv').config({ path: '.env.test' });

// Test database connection configuration
const testPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Database utilities for testing
const testDb = {
  pool: testPool,
  // Clear all data from tables
  async clearAllTables() {
    try {
      await testPool.query('DELETE FROM todos');
      await testPool.query('ALTER SEQUENCE todos_id_seq RESTART WITH 1');
    } catch (error) {
      console.error('Error clearing tables:', error);
      throw error;
    }
  },

  // Setup test database
  async setupTestDb() {
    try {
      // Create todos table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT FALSE,
          priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await testPool.query(createTableQuery);
    } catch (error) {
      console.error('Error setting up test database:', error);
      throw error;
    }
  },

  // Teardown test database
  async teardownTestDb() {
    try {
      await this.clearAllTables();
      await testPool.end();
    } catch (error) {
      console.error('Error tearing down test database:', error);
      throw error;
    }
  },

  // Insert test data
  async insertTestTodo(todoData) {
    const query = `
      INSERT INTO todos (title, description, priority, completed) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
    const values = [
      todoData.title,
      todoData.description || null,
      todoData.priority || 'medium',
      todoData.completed || false
    ];
    const result = await testPool.query(query, values);
    return result.rows[0];
  },

  // Get all todos
  async getAllTodos() {
    const result = await testPool.query('SELECT * FROM todos ORDER BY created_at DESC');
    return result.rows;
  }
};

module.exports = testDb;
