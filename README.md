# Employee Management System

A full-stack CRUD application for managing employees built with Node.js, TypeScript, Express, React, and MySQL.

## Features

- Create, Read, Update, and Delete employee records
- Modern React UI with TypeScript
- RESTful API backend with Express and TypeScript
- MySQL database integration
- Responsive design

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose (recommended for database)
- npm or yarn

## Quick Start with Docker (Recommended)

### 1. Start MySQL Database

```bash
# Start MySQL in Docker
docker-compose up -d

# Verify it's running
docker-compose ps
```

The database will be automatically created with these credentials:
- **Host**: localhost
- **Port**: 3307 (mapped from container port 3306)
- **Database**: employee_db
- **User**: mysql_user
- **Password**: mysql_password

**Note**: Port 3307 is used to avoid conflicts with other MySQL instances. The `.env` file is already configured correctly.

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# The .env file is already configured for Docker MySQL
# No need to change anything if using Docker!

# Run the backend server (development mode)
npm run dev
```

The backend server will start on `http://localhost:5001` and automatically create the employees table.

**Note**: Port 5001 is used instead of 5000 to avoid conflicts with macOS AirPlay Receiver.

### 3. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run the frontend development server
npm run dev
```

The frontend will start on `http://localhost:3000`

## Docker Commands

```bash
# Start MySQL database
docker-compose up -d

# Stop MySQL database
docker-compose down

# View database logs
docker-compose logs mysql

# Stop and remove all data (fresh start)
docker-compose down -v
```

## Manual Database Setup (Alternative)

If you prefer not to use Docker, you can set up MySQL manually:

1. Install and start MySQL on your system
2. Create database: `CREATE DATABASE employee_db;`
3. Update `backend/.env` with your MySQL credentials
4. See [Troubleshooting](#troubleshooting) section for help

## Project Structure

```
sample-project/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts      # Database configuration
│   │   ├── controllers/
│   │   │   └── employeeController.ts  # CRUD controllers
│   │   ├── models/
│   │   │   └── Employee.ts      # Employee interface
│   │   ├── routes/
│   │   │   └── employeeRoutes.ts # API routes
│   │   └── index.ts              # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EmployeeForm.tsx  # Form component
│   │   │   └── EmployeeList.tsx   # List component
│   │   ├── services/
│   │   │   └── api.ts            # API service
│   │   ├── types/
│   │   │   └── Employee.ts       # TypeScript types
│   │   ├── App.tsx               # Main app component
│   │   └── main.tsx              # Entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Endpoints

- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

## Usage

1. Start the backend server (port 5001)
2. Start the frontend server (port 3000)
3. Open `http://localhost:3000` in your browser
4. Click "Add New Employee" to create an employee
5. Use Edit/Delete buttons to manage employees

## Troubleshooting

### Docker Issues

**If Docker container won't start:**
```bash
# Check if port 3306 is already in use
lsof -i :3306

# If port is in use, stop local MySQL or change port in docker-compose.yml
```

**If you get connection errors:**
- Make sure Docker container is running: `docker-compose ps`
- Check container logs: `docker-compose logs mysql`
- Verify .env file has correct credentials (should match docker-compose.yml)

### MySQL Authentication Error (Manual Setup)

If you see `Access denied for user` error:

1. **Use Docker instead** (recommended): `docker-compose up -d`

2. **Or test your connection**:
   ```bash
   cd backend
   node test-db-connection.js
   ```

3. **Update `.env` file** with correct credentials:
   - Open `backend/.env`
   - Update `DB_PASSWORD` with your MySQL password

4. **See detailed guide**: Check `backend/SETUP.md` for more troubleshooting steps.

## Technologies Used

- **Backend**: Node.js, Express, TypeScript, MySQL (mysql2)
- **Frontend**: React, TypeScript, Vite, Axios
- **Database**: MySQL (via Docker)
- **Containerization**: Docker & Docker Compose

