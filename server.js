const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const todoRoutes = require('./routes/todoRoutes');
const { initDatabase } = require('./scripts/init-db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', todoRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Todo API',
    version: '1.0.0',
    endpoints: {
      'GET /api/todos': 'Get all todos',
      'GET /api/todos/:id': 'Get a specific todo',
      'POST /api/todos': 'Create a new todo',
      'PUT /api/todos/:id': 'Update a todo',
      'DELETE /api/todos/:id': 'Delete a todo',
      'GET /api/todos/filter/:status': 'Filter todos by status (completed/pending)'
    },
    documentation: '/api/docs'
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Todo API Documentation',
    description: 'A simple Todo List API with PostgreSQL',
    version: '1.0.0',
    baseUrl: req.protocol + '://' + req.get('host'),
    endpoints: [
      {
        method: 'GET',
        path: '/api/todos',
        description: 'Get all todos',
        response: 'Array of todo objects'
      },
      {
        method: 'GET',
        path: '/api/todos/:id',
        description: 'Get a specific todo by ID',
        parameters: { id: 'Todo ID (integer)' },
        response: 'Todo object'
      },
      {
        method: 'POST',
        path: '/api/todos',
        description: 'Create a new todo',
        body: {
          title: 'string (required)',
          description: 'string (optional)',
          priority: 'string (optional: low, medium, high)'
        },
        response: 'Created todo object'
      },
      {
        method: 'PUT',
        path: '/api/todos/:id',
        description: 'Update a todo',
        parameters: { id: 'Todo ID (integer)' },
        body: {
          title: 'string (optional)',
          description: 'string (optional)',
          completed: 'boolean (optional)',
          priority: 'string (optional: low, medium, high)'
        },
        response: 'Updated todo object'
      },
      {
        method: 'DELETE',
        path: '/api/todos/:id',
        description: 'Delete a todo',
        parameters: { id: 'Todo ID (integer)' },
        response: 'Deleted todo object'
      },
      {
        method: 'GET',
        path: '/api/todos/filter/:status',
        description: 'Filter todos by completion status',
        parameters: { status: 'completed or pending' },
        response: 'Array of filtered todo objects'
      }
    ],
    examples: {
      createTodo: {
        url: 'POST /api/todos',
        body: {
          title: 'Learn Node.js',
          description: 'Complete the Node.js tutorial',
          priority: 'high'
        }
      },
      updateTodo: {
        url: 'PUT /api/todos/1',
        body: {
          completed: true
        }
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableEndpoints: [
      'GET /',
      'GET /api/docs',
      'GET /health',
      'GET /api/todos',
      'POST /api/todos',
      'PUT /api/todos/:id',
      'DELETE /api/todos/:id'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
