const testDb = require('../testDb');
const TodoController = require('../../controllers/todoController');

// Mock the main database to use test database
jest.mock('../../config/database', () => require('../testDb').pool);

describe('TodoController Integration Tests', () => {
  beforeAll(async () => {
    await testDb.setupTestDb();
  });

  beforeEach(async () => {
    await testDb.clearAllTables();
  });

  afterAll(async () => {
    await testDb.teardownTestDb();
  });

  describe('Database Integration - CRUD Operations', () => {
    it('should perform complete CRUD cycle with database', async () => {
      // CREATE - Insert a new todo
      const todoData = global.testUtils.generateTestTodo({
        title: 'Integration Test Todo',
        description: 'Testing database integration',
        priority: 'high'
      });

      const createReq = { body: todoData };
      const createRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.createTodo(createReq, createRes);
      
      expect(createRes.status).toHaveBeenCalledWith(201);
      expect(createRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todo created successfully',
        data: expect.objectContaining({
          id: expect.any(Number),
          title: todoData.title,
          description: todoData.description,
          priority: todoData.priority
        })
      });

      const createdTodo = createRes.json.mock.calls[0][0].data;

      // READ - Get all todos
      const getAllReq = {};
      const getAllRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getAllTodos(getAllReq, getAllRes);
        expect(getAllRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: createdTodo.id })
        ]),
        count: expect.any(Number)
      });

      // READ - Get specific todo
      const getByIdReq = { params: { id: createdTodo.id.toString() } };
      const getByIdRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getTodoById(getByIdReq, getByIdRes);
      
      expect(getByIdRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: createdTodo.id,
          title: todoData.title
        })
      });

      // UPDATE - Update the todo
      const updateReq = {
        params: { id: createdTodo.id.toString() },
        body: { completed: true, title: 'Updated Integration Test Todo' }
      };
      const updateRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.updateTodo(updateReq, updateRes);
      
      expect(updateRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todo updated successfully',
        data: expect.objectContaining({
          id: createdTodo.id,
          completed: true,
          title: 'Updated Integration Test Todo'
        })
      });

      // DELETE - Delete the todo
      const deleteReq = { params: { id: createdTodo.id.toString() } };
      const deleteRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.deleteTodo(deleteReq, deleteRes);
      
      expect(deleteRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todo deleted successfully',
        data: expect.objectContaining({
          id: createdTodo.id
        })
      });

      // Verify deletion
      const verifyDeleteReq = { params: { id: createdTodo.id.toString() } };
      const verifyDeleteRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getTodoById(verifyDeleteReq, verifyDeleteRes);
      
      expect(verifyDeleteRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle filtering by status with database', async () => {
      // Insert test todos with different statuses
      const testTodos = [
        { title: 'Completed Todo 1', completed: true, priority: 'high' },
        { title: 'Completed Todo 2', completed: true, priority: 'medium' },
        { title: 'Pending Todo 1', completed: false, priority: 'low' },
        { title: 'Pending Todo 2', completed: false, priority: 'high' }
      ];

      // Insert all test todos
      for (const todo of testTodos) {
        await testDb.insertTestTodo(todo);
      }

      // Test filtering completed todos
      const completedReq = { params: { status: 'completed' } };
      const completedRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getTodosByStatus(completedReq, completedRes);
      
      expect(completedRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ completed: true }),
          expect.objectContaining({ completed: true })
        ]),
        count: 2,
        status: 'completed'
      });

      // Test filtering pending todos
      const pendingReq = { params: { status: 'pending' } };
      const pendingRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getTodosByStatus(pendingReq, pendingRes);
      
      expect(pendingRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ completed: false }),
          expect.objectContaining({ completed: false })
        ]),
        count: 2,
        status: 'pending'
      });
    });

    it('should handle priority levels correctly in database', async () => {
      const priorities = ['low', 'medium', 'high'];
      
      // Insert todos with different priorities
      for (let i = 0; i < priorities.length; i++) {
        const todoData = {
          title: `Priority Test Todo ${i + 1}`,
          description: `Testing ${priorities[i]} priority`,
          priority: priorities[i]
        };

        const createReq = { body: todoData };
        const createRes = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis()
        };

        await TodoController.createTodo(createReq, createRes);
        
        expect(createRes.status).toHaveBeenCalledWith(201);
        expect(createRes.json).toHaveBeenCalledWith({
          success: true,
          message: 'Todo created successfully',
          data: expect.objectContaining({
            priority: priorities[i]
          })
        });
      }

      // Verify all todos were created with correct priorities
      const getAllReq = {};
      const getAllRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getAllTodos(getAllReq, getAllRes);
      
      const allTodos = getAllRes.json.mock.calls[0][0].data;
      expect(allTodos).toHaveLength(3);
      
      const savedPriorities = allTodos.map(todo => todo.priority).sort();
      expect(savedPriorities).toEqual(['high', 'low', 'medium']);
    });

    it('should maintain data consistency during concurrent operations', async () => {
      const todoData = global.testUtils.generateTestTodo({
        title: 'Concurrency Test Todo'
      });

      // Create initial todo
      const createReq = { body: todoData };
      const createRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.createTodo(createReq, createRes);
      const createdTodo = createRes.json.mock.calls[0][0].data;

      // Simulate concurrent updates
      const update1Req = {
        params: { id: createdTodo.id.toString() },
        body: { title: 'Concurrent Update 1' }
      };
      const update1Res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      const update2Req = {
        params: { id: createdTodo.id.toString() },
        body: { completed: true }
      };
      const update2Res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // Execute concurrent updates
      await Promise.all([
        TodoController.updateTodo(update1Req, update1Res),
        TodoController.updateTodo(update2Req, update2Res)
      ]);

      // Both updates should succeed
      expect(update1Res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Todo updated successfully'
        })
      );

      expect(update2Res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Todo updated successfully'
        })
      );

      // Verify final state
      const getByIdReq = { params: { id: createdTodo.id.toString() } };
      const getByIdRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getTodoById(getByIdReq, getByIdRes);
      const finalTodo = getByIdRes.json.mock.calls[0][0].data;

      // At least one of the updates should be reflected
      expect(finalTodo.id).toBe(createdTodo.id);
      expect(finalTodo.updated_at).not.toBe(createdTodo.updated_at);
    });
  });
});
