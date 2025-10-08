# Development Quick Start Commands

# Backend (Flask API)

cd backend
viego_env\Scripts\activate # Windows

# source viego_env/bin/activate # Linux/Mac

python app.py

# Frontend (Next.js) - Run in separate terminal

cd frontend
npm run dev

# Access URLs:

# Frontend: http://localhost:3000

# Backend API: http://localhost:5000

# Database (phpMyAdmin): http://localhost/phpmyadmin

# Production Build

cd frontend
npm run build
npm start

# Database Commands

# Import schema:

mysql -u root -p < database/schema.sql

# Backup database:

mysqldump -u root -p viego_blog > backup.sql
