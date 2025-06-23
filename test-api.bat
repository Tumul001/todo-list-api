@echo off
echo 🧪 Testing Todo API Endpoints
echo ================================

set BASE_URL=http://localhost:3000

echo.
echo 1. Testing Health Check...
curl -s -X GET "%BASE_URL%/health"

echo.
echo.
echo 2. Creating a new todo...
curl -s -X POST "%BASE_URL%/api/todos" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\": \"Test Todo\", \"description\": \"This is a test todo item\", \"priority\": \"high\"}"

echo.
echo.
echo 3. Getting all todos...
curl -s -X GET "%BASE_URL%/api/todos"

echo.
echo.
echo 4. Creating another todo...
curl -s -X POST "%BASE_URL%/api/todos" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\": \"Second Todo\", \"description\": \"Another test item\", \"priority\": \"medium\"}"

echo.
echo.
echo 5. Getting todo by ID 1...
curl -s -X GET "%BASE_URL%/api/todos/1"

echo.
echo.
echo 6. Updating todo ID 1 to completed...
curl -s -X PUT "%BASE_URL%/api/todos/1" ^
  -H "Content-Type: application/json" ^
  -d "{\"completed\": true, \"title\": \"Updated Test Todo\"}"

echo.
echo.
echo 7. Filtering completed todos...
curl -s -X GET "%BASE_URL%/api/todos/filter/completed"

echo.
echo.
echo 8. Filtering pending todos...
curl -s -X GET "%BASE_URL%/api/todos/filter/pending"

echo.
echo.
echo 9. Deleting todo ID 1...
curl -s -X DELETE "%BASE_URL%/api/todos/1"

echo.
echo.
echo 10. Verifying deletion...
curl -s -X GET "%BASE_URL%/api/todos/1"

echo.
echo.
echo ✅ All tests completed!
