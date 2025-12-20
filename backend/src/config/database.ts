import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'employee_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export const initializeDatabase = async () => {
  try {
    // Test connection first
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Create employees table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        position VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        salary DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Employees table initialized successfully');
  } catch (error: any) {
    if (error.code === '28P01') {
      console.error('\n❌ PostgreSQL Authentication Failed!');
      console.error('Please check your database credentials in the .env file.');
      console.error('If using Docker, make sure PostgreSQL container is running: docker-compose up -d\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Cannot connect to PostgreSQL!');
      console.error('Make sure PostgreSQL is running.');
      console.error('If using Docker: docker-compose up -d\n');
    } else {
      console.error('Error initializing database:', error.message);
    }
    throw error;
  }
};

