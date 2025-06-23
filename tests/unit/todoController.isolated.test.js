const TodoController = require('../../controllers/todoController');

// Mock the database pool
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

const mockPool = require('../../config/database');

describe('TodoController Unit Tests (Isolated)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTodos Method', () => {
    it('should return empty array when no todos exist', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getAllTodos(req, res);

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM todos ORDER BY created_at DESC');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        count: 0
      });
    });

    it('should return todos successfully', async () => {
      const mockTodos = [
        { id: 1, title: 'Test Todo 1', completed: false },
        { id: 2, title: 'Test Todo 2', completed: true }
      ];

      mockPool.query.mockResolvedValue({ rows: mockTodos });

      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getAllTodos(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTodos,
        count: 2
      });
    });

    it('should handle database connection errors', async () => {
      const mockError = new Error('Connection failed');
      mockPool.query.mockRejectedValue(mockError);

      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getAllTodos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching todos',
        error: 'Connection failed'
      });
    });
  });

  describe('createTodo Method', () => {
    it('should create todo with all fields', async () => {
      const newTodo = {
        id: 1,
        title: 'New Todo',
        description: 'Description',
        priority: 'high',
        completed: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [newTodo] });

      const req = {
        body: {
          title: 'New Todo',
          description: 'Description',
          priority: 'high'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.createTodo(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todo created successfully',
        data: newTodo
      });
    });

    it('should require title field', async () => {
      const req = { body: { description: 'No title' } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.createTodo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Title is required'
      });
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should use default priority when not specified', async () => {
      const newTodo = { id: 1, title: 'Test', priority: 'medium' };
      mockPool.query.mockResolvedValue({ rows: [newTodo] });

      const req = { body: { title: 'Test' } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.createTodo(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['Test', undefined, 'medium']
      );
    });
  });

  describe('updateTodo Method', () => {
    it('should update existing todo', async () => {
      const existingTodo = { id: 1, title: 'Original' };
      const updatedTodo = { id: 1, title: 'Updated', completed: true };

      mockPool.query
        .mockResolvedValueOnce({ rows: [existingTodo] })
        .mockResolvedValueOnce({ rows: [updatedTodo] });

      const req = {
        params: { id: '1' },
        body: { title: 'Updated', completed: true }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.updateTodo(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todo updated successfully',
        data: updatedTodo
      });
    });

    it('should return 404 for non-existent todo', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = {
        params: { id: '999' },
        body: { title: 'Update' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.updateTodo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Todo not found'
      });
    });
  });

  describe('deleteTodo Method', () => {
    it('should delete existing todo', async () => {
      const deletedTodo = { id: 1, title: 'Deleted' };
      mockPool.query.mockResolvedValue({ rows: [deletedTodo] });

      const req = { params: { id: '1' } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.deleteTodo(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todo deleted successfully',
        data: deletedTodo
      });
    });

    it('should return 404 for non-existent todo', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = { params: { id: '999' } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.deleteTodo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Todo not found'
      });
    });
  });

  describe('getTodosByStatus Method', () => {
    it('should filter completed todos', async () => {
      const completedTodos = [
        { id: 1, title: 'Done 1', completed: true },
        { id: 2, title: 'Done 2', completed: true }
      ];

      mockPool.query.mockResolvedValue({ rows: completedTodos });

      const req = { params: { status: 'completed' } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getTodosByStatus(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM todos WHERE completed = $1 ORDER BY created_at DESC',
        [true]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: completedTodos,
        count: 2,
        status: 'completed'
      });
    });

    it('should filter pending todos', async () => {
      const pendingTodos = [
        { id: 3, title: 'Pending 1', completed: false }
      ];

      mockPool.query.mockResolvedValue({ rows: pendingTodos });

      const req = { params: { status: 'pending' } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getTodosByStatus(req, res);

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM todos WHERE completed = $1 ORDER BY created_at DESC',
        [false]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: pendingTodos,
        count: 1,
        status: 'pending'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected database errors in createTodo', async () => {
      const dbError = new Error('Database constraint violation');
      mockPool.query.mockRejectedValue(dbError);

      const req = { body: { title: 'Test Todo' } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.createTodo(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating todo',
        error: 'Database constraint violation'
      });
    });

    it('should handle database errors in updateTodo', async () => {
      const dbError = new Error('Update failed');
      mockPool.query.mockRejectedValue(dbError);

      const req = {
        params: { id: '1' },
        body: { title: 'Updated' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.updateTodo(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error updating todo',
        error: 'Update failed'
      });
    });
  });
});
