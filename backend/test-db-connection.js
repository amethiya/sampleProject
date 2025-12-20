const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres', // Connect to default postgres database first
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testConnection() {
  console.log('Testing PostgreSQL connection...');
  console.log('Host:', process.env.DB_HOST || 'localhost');
  console.log('Port:', process.env.DB_PORT || '5432');
  console.log('User:', process.env.DB_USER || 'postgres');
  console.log('Password:', process.env.DB_PASSWORD ? '***' : '(not set)');
  console.log('');

  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful!');
    console.log('Server time:', result.rows[0].now);
    
    // Check if database exists
    const dbCheck = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'employee_db']
    );
    
    if (dbCheck.rows.length === 0) {
      console.log(`\n⚠️  Database "${process.env.DB_NAME || 'employee_db'}" does not exist.`);
      console.log('Creating database...');
      await pool.query(`CREATE DATABASE ${process.env.DB_NAME || 'employee_db'}`);
      console.log('✅ Database created successfully!');
    } else {
      console.log(`✅ Database "${process.env.DB_NAME || 'employee_db'}" exists.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check your password in backend/.env file');
    console.error('3. Try connecting with: psql -U postgres');
    console.error('4. If no password works, try empty password: DB_PASSWORD=');
    process.exit(1);
  }
}

testConnection();

