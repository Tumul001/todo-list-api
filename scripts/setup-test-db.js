const { Client } = require('pg');
require('dotenv').config({ path: '.env.test' });

async function setupTestDatabase() {
  console.log('🏗️  Setting up test database...');
  
  // Connect to PostgreSQL without specifying a database
  const connectionUrl = process.env.DATABASE_URL.replace('/todoapp_test', '/postgres');
  
  const client = new Client({
    connectionString: connectionUrl,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Drop test database if it exists
    try {
      await client.query('DROP DATABASE IF EXISTS todoapp_test');
      console.log('🗑️  Dropped existing test database');
    } catch (error) {
      // Ignore error if database doesn't exist
    }

    // Create test database
    await client.query('CREATE DATABASE todoapp_test');
    console.log('✅ Test database "todoapp_test" created');

    await client.end();

    // Connect to the test database and create tables
    const testClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });

    await testClient.connect();
    console.log('✅ Connected to test database');

    // Create todos table
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

    await testClient.query(createTableQuery);
    console.log('✅ Test tables created');

    await testClient.end();
    console.log('🎉 Test database setup complete!');

  } catch (error) {
    console.error('❌ Error setting up test database:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase };
