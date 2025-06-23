# Todo API

A simple Todo List API built with Node.js, Express, and PostgreSQL. This API provides full CRUD operations for managing todo items and is ready for deployment on Render.

## Features

- ✅ Complete CRUD operations (Create, Read, Update, Delete)
- ✅ PostgreSQL database integration
- ✅ RESTful API design
- ✅ Input validation and error handling
- ✅ Priority levels (low, medium, high)
- ✅ Filter todos by completion status
- ✅ API documentation endpoint
- ✅ Health check endpoint
- ✅ Ready for Render deployment

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | Get all todos |
| GET | `/api/todos/:id` | Get a specific todo |
| POST | `/api/todos` | Create a new todo |
| PUT | `/api/todos/:id` | Update a todo |
| DELETE | `/api/todos/:id` | Delete a todo |
| GET | `/api/todos/filter/:status` | Filter todos by status (completed/pending) |
| GET | `/api/docs` | API documentation |
| GET | `/health` | Health check |

## Quick Start

### Local Development with PostgreSQL

1. **Install dependencies:**
   ```powershell
   # Run this in PowerShell
   .\install.bat
   # OR run the PowerShell setup script
   .\setup.ps1
   ```

2. **Set up PostgreSQL database:**
   
   **Option A: Using psql command line:**
   ```bash
   # Create the database
   psql -U postgres -c "CREATE DATABASE todoapp;"
   
   # Run the setup script
   psql -U postgres -d todoapp -f database-setup.sql
   ```
   
   **Option B: Using pgAdmin or any PostgreSQL client:**
   - Create a new database named `todoapp`
   - Run the SQL commands from `database-setup.sql`

3. **Configure environment variables:**
   Update your `.env` file with your PostgreSQL credentials:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/todoapp
   ```

4. **Start the server:**
   ```powershell
   npm start
   ```

5. **Test the API:**
   ```powershell
   .\test-api.bat
   ```

6. **Access the API:**
   - API Base URL: `http://localhost:3000`
   - Documentation: `http://localhost:3000/api/docs`
   - Health Check: `http://localhost:3000/health`

### Render Deployment

1. **Connect your GitHub repository to Render**
2. **Set environment variables in Render:**
   - `DATABASE_URL`: Your Render PostgreSQL connection string
   - `NODE_ENV`: production

3. **Deploy:** Render will automatically build and deploy your app

## Testing with cURL

### 1. Get all todos
```bash
curl -X GET http://localhost:3000/api/todos
```

### 2. Create a new todo
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn Node.js",
    "description": "Complete the Node.js tutorial",
    "priority": "high"
  }'
```

### 3. Update a todo
```bash
curl -X PUT http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

### 4. Delete a todo
```bash
curl -X DELETE http://localhost:3000/api/todos/1
```

### 5. Filter completed todos
```bash
curl -X GET http://localhost:3000/api/todos/filter/completed
```

### 6. Filter pending todos
```bash
curl -X GET http://localhost:3000/api/todos/filter/pending
```

## Database Schema

The `todos` table has the following structure:

```sql
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": {...}|[...],
  "count": number,
  "error": "Error message (if any)"
}
```

## Error Handling

The API includes comprehensive error handling:
- 400: Bad Request (missing required fields)
- 404: Not Found (todo doesn't exist)
- 500: Internal Server Error

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **pg** - PostgreSQL client
- **cors** - Cross-origin resource sharing
- **helmet** - Security middleware
- **dotenv** - Environment variable management

## Project Structure

```
todo-api/
├── config/
│   └── database.js          # Database connection
├── controllers/
│   └── todoController.js    # Business logic
├── routes/
│   └── todoRoutes.js        # API routes
├── scripts/
│   └── init-db.js           # Database initialization
├── .env                     # Environment variables
├── .gitignore               # Git ignore rules
├── database-setup.sql       # Database schema (reference)
├── install.bat              # Dependency installation
├── package.json             # Dependencies and scripts
├── README.md                # Documentation
├── server.js                # Main server file
└── test-api.bat             # API testing script
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the ISC License.
