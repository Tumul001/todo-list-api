const TodoController = require('../../controllers/todoController');

// Mock the database pool
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

const mockPool = require('../../config/database');

describe('TodoController Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTodos', () => {
    it('should return all todos successfully', async () => {
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

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM todos ORDER BY created_at DESC');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTodos,
        count: 2
      });
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed');
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
        error: 'Database connection failed'
      });
    });
  });

  describe('getTodoById', () => {
    it('should return a specific todo', async () => {
      const mockTodo = { id: 1, title: 'Test Todo', completed: false };
      mockPool.query.mockResolvedValue({ rows: [mockTodo] });

      const req = { params: { id: '1' } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getTodoById(req, res);

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM todos WHERE id = $1', ['1']);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTodo
      });
    });

    it('should return 404 when todo not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = { params: { id: '999' } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await TodoController.getTodoById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Todo not found'
      });
    });
  });

  describe('createTodo', () => {
    it('should create a new todo successfully', async () => {
      const newTodo = {
        id: 1,
        title: 'New Todo',
        description: 'New Description',
        priority: 'high',
        completed: false
      };

      mockPool.query.mockResolvedValue({ rows: [newTodo] });

      const req = {
        body: {
          title: 'New Todo',
          description: 'New Description',
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

    it('should return 400 when title is missing', async () => {
      const req = { body: { description: 'Description without title' } };
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
    });
  });

  describe('updateTodo', () => {
    it('should update a todo successfully', async () => {
      const existingTodo = { id: 1, title: 'Old Title' };
      const updatedTodo = { id: 1, title: 'Updated Title', completed: true };

      mockPool.query
        .mockResolvedValueOnce({ rows: [existingTodo] }) // Check if exists
        .mockResolvedValueOnce({ rows: [updatedTodo] }); // Update query

      const req = {
        params: { id: '1' },
        body: { title: 'Updated Title', completed: true }
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

    it('should return 404 when trying to update non-existent todo', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = {
        params: { id: '999' },
        body: { title: 'Updated Title' }
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

  describe('deleteTodo', () => {
    it('should delete a todo successfully', async () => {
      const deletedTodo = { id: 1, title: 'Deleted Todo' };
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

    it('should return 404 when trying to delete non-existent todo', async () => {
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

  describe('getTodosByStatus', () => {
    it('should filter todos by completed status', async () => {
      const completedTodos = [
        { id: 1, title: 'Completed Todo 1', completed: true },
        { id: 2, title: 'Completed Todo 2', completed: true }
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

    it('should filter todos by pending status', async () => {
      const pendingTodos = [
        { id: 3, title: 'Pending Todo 1', completed: false }
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
});
