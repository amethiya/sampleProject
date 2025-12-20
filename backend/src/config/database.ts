import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'employee_db',
  user: process.env.DB_USER || 'mysql_user',
  password: process.env.DB_PASSWORD || 'mysql_password',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const initializeDatabase = async () => {
  try {
    // Test connection first
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Create employees table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        position VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        salary DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Employees table initialized successfully');
  } catch (error: any) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n❌ MySQL Authentication Failed!');
      console.error('Please check your database credentials in the .env file.');
      console.error('If using Docker, make sure MySQL container is running: docker-compose up -d\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Cannot connect to MySQL!');
      console.error('Make sure MySQL is running.');
      console.error('If using Docker: docker-compose up -d\n');
    } else {
      console.error('Error initializing database:', error.message);
    }
    throw error;
  }
};

