const pool = require('../config/database');

class TodoController {
  // GET /api/todos - Get all todos
  static async getAllTodos(req, res) {
    try {
      const { rows } = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
      res.json({
        success: true,
        data: rows,
        count: rows.length
      });
    } catch (error) {
      console.error('Error fetching todos:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching todos',
        error: error.message
      });
    }
  }

  // GET /api/todos/:id - Get a specific todo
  static async getTodoById(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }

      res.json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      console.error('Error fetching todo:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching todo',
        error: error.message
      });
    }
  }

  // POST /api/todos - Create a new todo
  static async createTodo(req, res) {
    try {
      const { title, description, priority = 'medium' } = req.body;
      
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }

      const query = `
        INSERT INTO todos (title, description, priority) 
        VALUES ($1, $2, $3) 
        RETURNING *
      `;
      const values = [title, description, priority];
      const { rows } = await pool.query(query, values);

      res.status(201).json({
        success: true,
        message: 'Todo created successfully',
        data: rows[0]
      });
    } catch (error) {
      console.error('Error creating todo:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating todo',
        error: error.message
      });
    }
  }

  // PUT /api/todos/:id - Update a todo
  static async updateTodo(req, res) {
    try {
      const { id } = req.params;
      const { title, description, completed, priority } = req.body;

      // Check if todo exists
      const checkQuery = 'SELECT * FROM todos WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }

      const updateQuery = `
        UPDATE todos 
        SET title = COALESCE($1, title),
            description = COALESCE($2, description),
            completed = COALESCE($3, completed),
            priority = COALESCE($4, priority),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `;
      const values = [title, description, completed, priority, id];
      const { rows } = await pool.query(updateQuery, values);

      res.json({
        success: true,
        message: 'Todo updated successfully',
        data: rows[0]
      });
    } catch (error) {
      console.error('Error updating todo:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating todo',
        error: error.message
      });
    }
  }

  // DELETE /api/todos/:id - Delete a todo
  static async deleteTodo(req, res) {
    try {
      const { id } = req.params;
      
      const { rows } = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }

      res.json({
        success: true,
        message: 'Todo deleted successfully',
        data: rows[0]
      });
    } catch (error) {
      console.error('Error deleting todo:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting todo',
        error: error.message
      });
    }
  }

  // GET /api/todos/filter/:status - Filter todos by completion status
  static async getTodosByStatus(req, res) {
    try {
      const { status } = req.params;
      const completed = status === 'completed';
      
      const { rows } = await pool.query(
        'SELECT * FROM todos WHERE completed = $1 ORDER BY created_at DESC',
        [completed]
      );

      res.json({
        success: true,
        data: rows,
        count: rows.length,
        status: status
      });
    } catch (error) {
      console.error('Error filtering todos:', error);
      res.status(500).json({
        success: false,
        message: 'Error filtering todos',
        error: error.message
      });
    }
  }
}

module.exports = TodoController;
