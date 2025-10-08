@echo off
REM Quick test script for Blog System features
echo ============================================================
echo   VieGo Blog - Blog System Quick Test
echo ============================================================
echo.

echo Testing backend APIs...
echo.

echo [1/6] Testing Login...
py -c "import requests; r = requests.post('http://localhost:5000/api/auth/login', json={'identifier':'admin@viego.com','password':'admin123'}); print('Status:', r.status_code); token = r.json()['access_token'] if r.status_code == 200 else None; exit(0 if token else 1)"
if %errorlevel% neq 0 (
    echo    FAILED: Login not working!
    echo    Make sure backend is running: run_backend.bat
    pause
    exit /b 1
)
echo    OK: Login successful

echo.
echo [2/6] Testing Get Posts...
py -c "import requests; r = requests.get('http://localhost:5000/api/posts'); print('Status:', r.status_code); print('Posts:', len(r.json()['posts']))"

echo.
echo [3/6] Testing Like with Slug...
py -c "import requests; token = requests.post('http://localhost:5000/api/auth/login', json={'identifier':'admin@viego.com','password':'admin123'}).json()['access_token']; posts = requests.get('http://localhost:5000/api/posts').json()['posts']; slug = posts[0]['slug'] if posts else None; r = requests.get(f'http://localhost:5000/api/social/likes/check/{slug}', headers={'Authorization': f'Bearer {token}'}); print('Status:', r.status_code); print('Response:', r.json())"

echo.
echo [4/6] Testing Bookmark...
py -c "import requests; token = requests.post('http://localhost:5000/api/auth/login', json={'identifier':'admin@viego.com','password':'admin123'}).json()['access_token']; r = requests.get('http://localhost:5000/api/social/bookmarks', headers={'Authorization': f'Bearer {token}'}); print('Status:', r.status_code); print('Bookmarks:', len(r.json()['bookmarks']))"

echo.
echo [5/6] Testing Comments Endpoint...
py -c "import requests; posts = requests.get('http://localhost:5000/api/posts').json()['posts']; post_id = posts[0]['id'] if posts else None; r = requests.get(f'http://localhost:5000/api/comments/post/{post_id}'); print('Status:', r.status_code); print('Comments:', len(r.json().get('comments', [])))"

echo.
echo [6/6] Testing Upload Endpoint Exists...
py -c "import requests; r = requests.get('http://localhost:5000/api/upload/image'); print('Endpoint exists:', r.status_code != 404)"

echo.
echo ============================================================
echo   All Backend Tests Complete!
echo ============================================================
echo.
echo Next steps:
echo   1. Start frontend: run_frontend.bat
echo   2. Open browser: http://localhost:3000
echo   3. Test UI features:
echo      - Create a new post at /posts/create
echo      - View post detail
echo      - Try like/bookmark buttons
echo      - Add a comment
echo.
pause
