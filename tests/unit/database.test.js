const testDb = require('../testDb');

describe('Database Configuration Tests', () => {
  beforeAll(async () => {
    await testDb.setupTestDb();
  });

  afterAll(async () => {
    await testDb.teardownTestDb();
  });

  beforeEach(async () => {
    await testDb.clearAllTables();
  });

  describe('Database Connection', () => {
    it('should connect to test database successfully', async () => {
      const result = await testDb.pool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });

    it('should have correct database name', async () => {
      const result = await testDb.pool.query('SELECT current_database()');
      expect(result.rows[0].current_database).toBe('todoapp_test');
    });
  });

  describe('Table Structure', () => {
    it('should have todos table with correct structure', async () => {
      const result = await testDb.pool.query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'todos' 
        ORDER BY ordinal_position
      `);

      const columns = result.rows;
      expect(columns).toHaveLength(7);

      // Check required columns exist
      const columnNames = columns.map(col => col.column_name);
      expect(columnNames).toEqual([
        'id', 'title', 'description', 'completed', 'priority', 'created_at', 'updated_at'
      ]);

      // Check column constraints
      const idColumn = columns.find(col => col.column_name === 'id');
      expect(idColumn.data_type).toBe('integer');
      expect(idColumn.is_nullable).toBe('NO');

      const titleColumn = columns.find(col => col.column_name === 'title');
      expect(titleColumn.data_type).toBe('character varying');
      expect(titleColumn.is_nullable).toBe('NO');

      const completedColumn = columns.find(col => col.column_name === 'completed');
      expect(completedColumn.data_type).toBe('boolean');
      expect(completedColumn.column_default).toBe('false');
    });

    it('should enforce priority check constraint', async () => {
      // Valid priorities should work
      const validPriorities = ['low', 'medium', 'high'];
      
      for (const priority of validPriorities) {
        const query = `
          INSERT INTO todos (title, priority) 
          VALUES ('Test Todo', $1) 
          RETURNING priority
        `;
        const result = await testDb.pool.query(query, [priority]);
        expect(result.rows[0].priority).toBe(priority);
      }

      // Invalid priority should fail
      const invalidQuery = `
        INSERT INTO todos (title, priority) 
        VALUES ('Test Todo', $1)
      `;
      
      await expect(
        testDb.pool.query(invalidQuery, ['invalid'])
      ).rejects.toThrow();
    });

    it('should auto-generate timestamps', async () => {
      const beforeInsert = new Date();
      
      const result = await testDb.pool.query(`
        INSERT INTO todos (title) 
        VALUES ('Timestamp Test') 
        RETURNING created_at, updated_at
      `);

      const afterInsert = new Date();
      const todo = result.rows[0];

      const createdAt = new Date(todo.created_at);
      const updatedAt = new Date(todo.updated_at);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
    });
  });

  describe('Test Database Utilities', () => {
    it('should clear all tables correctly', async () => {
      // Insert test data
      await testDb.insertTestTodo({ title: 'Test Todo 1' });
      await testDb.insertTestTodo({ title: 'Test Todo 2' });

      // Verify data exists
      let result = await testDb.pool.query('SELECT COUNT(*) FROM todos');
      expect(parseInt(result.rows[0].count)).toBe(2);

      // Clear tables
      await testDb.clearAllTables();

      // Verify data is cleared
      result = await testDb.pool.query('SELECT COUNT(*) FROM todos');
      expect(parseInt(result.rows[0].count)).toBe(0);

      // Verify ID sequence is reset
      const insertResult = await testDb.insertTestTodo({ title: 'New Todo' });
      expect(insertResult.id).toBe(1);
    });

    it('should insert test data correctly', async () => {
      const todoData = {
        title: 'Utility Test Todo',
        description: 'Testing utility functions',
        priority: 'high',
        completed: true
      };

      const insertedTodo = await testDb.insertTestTodo(todoData);

      expect(insertedTodo).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          title: todoData.title,
          description: todoData.description,
          priority: todoData.priority,
          completed: todoData.completed,
          created_at: expect.any(Date),
          updated_at: expect.any(Date)
        })
      );
    });

    it('should retrieve all todos correctly', async () => {
      // Insert multiple todos
      const testTodos = [
        { title: 'Todo 1', priority: 'high' },
        { title: 'Todo 2', priority: 'medium' },
        { title: 'Todo 3', priority: 'low' }
      ];

      for (const todo of testTodos) {
        await testDb.insertTestTodo(todo);
      }      const allTodos = await testDb.getAllTodos();
      expect(allTodos.length).toBeGreaterThanOrEqual(3);
      
      // Check that our inserted todos are present
      const todoTitles = allTodos.map(todo => todo.title);
      expect(todoTitles).toContain('Todo 1');
      expect(todoTitles).toContain('Todo 2');
      expect(todoTitles).toContain('Todo 3');
    });
  });

  describe('Database Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      // This test verifies error handling without actually breaking the connection
      const invalidQuery = 'SELECT * FROM non_existent_table';
      
      await expect(
        testDb.pool.query(invalidQuery)
      ).rejects.toThrow();
    });

    it('should handle constraint violations', async () => {
      // Try to insert without required title
      const invalidQuery = 'INSERT INTO todos (description) VALUES ($1)';
      
      await expect(
        testDb.pool.query(invalidQuery, ['Description without title'])
      ).rejects.toThrow();
    });

    it('should handle invalid data types', async () => {
      // Try to insert invalid data type for completed field
      const invalidQuery = 'INSERT INTO todos (title, completed) VALUES ($1, $2)';
      
      await expect(
        testDb.pool.query(invalidQuery, ['Test Todo', 'invalid_boolean'])
      ).rejects.toThrow();
    });
  });

  describe('Database Performance', () => {
    it('should handle bulk inserts efficiently', async () => {
      const startTime = Date.now();
      
      // Insert 100 todos
      const insertPromises = Array.from({ length: 100 }, (_, i) =>
        testDb.insertTestTodo({
          title: `Bulk Todo ${i + 1}`,
          priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low'
        })
      );

      await Promise.all(insertPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds

      // Verify all todos were inserted
      const allTodos = await testDb.getAllTodos();
      expect(allTodos).toHaveLength(100);
    });

    it('should handle concurrent database operations', async () => {
      const concurrentOperations = Array.from({ length: 20 }, async (_, i) => {
        // Mix of different operations
        if (i % 3 === 0) {
          return testDb.insertTestTodo({ title: `Concurrent Todo ${i}` });
        } else if (i % 3 === 1) {
          return testDb.getAllTodos();
        } else {
          return testDb.pool.query('SELECT COUNT(*) FROM todos');
        }
      });

      // All operations should complete without errors
      const results = await Promise.all(concurrentOperations);
      expect(results).toHaveLength(20);
    });
  });
});
