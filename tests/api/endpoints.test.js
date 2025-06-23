const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const todoRoutes = require('../../routes/todoRoutes');
const testDb = require('../testDb');

// Create test app
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Routes
  app.use('/api', todoRoutes);
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });
  
  return app;
};

// Mock the main database to use test database
jest.mock('../../config/database', () => require('../testDb').pool);

describe('Todo API Tests', () => {
  let app;

  beforeAll(async () => {
    app = createTestApp();
    await testDb.setupTestDb();
  });

  beforeEach(async () => {
    await testDb.clearAllTables();
  });

  afterAll(async () => {
    await testDb.teardownTestDb();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /api/todos', () => {
    it('should return empty array when no todos exist', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
        count: 0
      });
    });

    it('should return all todos when they exist', async () => {
      // Insert test data
      const testTodos = global.testUtils.generateMultipleTestTodos(3);
      for (const todo of testTodos) {
        await testDb.insertTestTodo(todo);
      }

      const response = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.count).toBe(3);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0]).toHaveProperty('created_at');
    });
  });

  describe('GET /api/todos/:id', () => {
    it('should return specific todo when it exists', async () => {
      const todoData = global.testUtils.generateTestTodo({
        title: 'Specific Todo Test'
      });
      const insertedTodo = await testDb.insertTestTodo(todoData);

      const response = await request(app)
        .get(`/api/todos/${insertedTodo.id}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: insertedTodo.id,
          title: 'Specific Todo Test'
        })
      });
    });

    it('should return 404 when todo does not exist', async () => {
      const response = await request(app)
        .get('/api/todos/999')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Todo not found'
      });
    });

    it('should handle invalid ID format', async () => {
      const response = await request(app)
        .get('/api/todos/invalid-id')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Error fetching todo');
    });
  });

  describe('POST /api/todos', () => {
    it('should create new todo with valid data', async () => {
      const newTodo = {
        title: 'New API Test Todo',
        description: 'Testing todo creation via API',
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/todos')
        .send(newTodo)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Todo created successfully',
        data: expect.objectContaining({
          id: expect.any(Number),
          title: newTodo.title,
          description: newTodo.description,
          priority: newTodo.priority,
          completed: false,
          created_at: expect.any(String),
          updated_at: expect.any(String)
        })
      });
    });

    it('should create todo with minimal data (title only)', async () => {
      const newTodo = { title: 'Minimal Todo' };

      const response = await request(app)
        .post('/api/todos')
        .send(newTodo)
        .expect(201);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          title: 'Minimal Todo',
          description: null,
          priority: 'medium',
          completed: false
        })
      );
    });

    it('should return 400 when title is missing', async () => {
      const invalidTodo = {
        description: 'Todo without title',
        priority: 'low'
      };

      const response = await request(app)
        .post('/api/todos')
        .send(invalidTodo)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Title is required'
      });
    });

    it('should validate priority values', async () => {
      const todoWithInvalidPriority = {
        title: 'Test Todo',
        priority: 'invalid-priority'
      };

      const response = await request(app)
        .post('/api/todos')
        .send(todoWithInvalidPriority)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle different priority levels', async () => {
      const priorities = ['low', 'medium', 'high'];

      for (const priority of priorities) {
        const newTodo = {
          title: `${priority} priority todo`,
          priority: priority
        };

        const response = await request(app)
          .post('/api/todos')
          .send(newTodo)
          .expect(201);

        expect(response.body.data.priority).toBe(priority);
      }
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('should update existing todo', async () => {
      const originalTodo = await testDb.insertTestTodo(
        global.testUtils.generateTestTodo({ title: 'Original Title' })
      );

      const updateData = {
        title: 'Updated Title',
        completed: true,
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/todos/${originalTodo.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Todo updated successfully',
        data: expect.objectContaining({
          id: originalTodo.id,
          title: 'Updated Title',
          completed: true,
          priority: 'high'
        })
      });
    });

    it('should allow partial updates', async () => {
      const originalTodo = await testDb.insertTestTodo(
        global.testUtils.generateTestTodo({
          title: 'Original Title',
          priority: 'low'
        })
      );

      const updateData = { completed: true };

      const response = await request(app)
        .put(`/api/todos/${originalTodo.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: originalTodo.id,
          title: 'Original Title', // Should remain unchanged
          priority: 'low', // Should remain unchanged
          completed: true // Should be updated
        })
      );
    });

    it('should return 404 when updating non-existent todo', async () => {
      const updateData = { title: 'Updated Title' };

      const response = await request(app)
        .put('/api/todos/999')
        .send(updateData)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Todo not found'
      });
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should delete existing todo', async () => {
      const todoToDelete = await testDb.insertTestTodo(
        global.testUtils.generateTestTodo({ title: 'To Be Deleted' })
      );

      const response = await request(app)
        .delete(`/api/todos/${todoToDelete.id}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Todo deleted successfully',
        data: expect.objectContaining({
          id: todoToDelete.id,
          title: 'To Be Deleted'
        })
      });

      // Verify deletion
      await request(app)
        .get(`/api/todos/${todoToDelete.id}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent todo', async () => {
      const response = await request(app)
        .delete('/api/todos/999')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Todo not found'
      });
    });
  });

  describe('GET /api/todos/filter/:status', () => {
    beforeEach(async () => {
      // Insert test data with mixed statuses
      const testTodos = [
        { title: 'Completed Todo 1', completed: true, priority: 'high' },
        { title: 'Completed Todo 2', completed: true, priority: 'medium' },
        { title: 'Pending Todo 1', completed: false, priority: 'low' },
        { title: 'Pending Todo 2', completed: false, priority: 'high' }
      ];

      for (const todo of testTodos) {
        await testDb.insertTestTodo(todo);
      }
    });

    it('should filter completed todos', async () => {
      const response = await request(app)
        .get('/api/todos/filter/completed')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ completed: true }),
          expect.objectContaining({ completed: true })
        ]),
        count: 2,
        status: 'completed'
      });

      // Ensure all returned todos are completed
      response.body.data.forEach(todo => {
        expect(todo.completed).toBe(true);
      });
    });

    it('should filter pending todos', async () => {
      const response = await request(app)
        .get('/api/todos/filter/pending')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ completed: false }),
          expect.objectContaining({ completed: false })
        ]),
        count: 2,
        status: 'pending'
      });

      // Ensure all returned todos are pending
      response.body.data.forEach(todo => {
        expect(todo.completed).toBe(false);
      });
    });

    it('should return empty array when no todos match filter', async () => {
      // Clear all data
      await testDb.clearAllTables();

      const response = await request(app)
        .get('/api/todos/filter/completed')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
        count: 0,
        status: 'completed'
      });
    });
  });

  describe('API Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('title=Test Todo')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Todo');
    });
  });

  describe('API Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/todos')
          .send({
            title: `Concurrent Todo ${i + 1}`,
            priority: i % 2 === 0 ? 'high' : 'low'
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(`Concurrent Todo ${index + 1}`);
      });

      // Verify all todos were created
      const getAllResponse = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(getAllResponse.body.count).toBe(10);
    });
  });
});
