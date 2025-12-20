const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('Testing MySQL connection...');
  console.log('Host:', process.env.DB_HOST || 'localhost');
  console.log('Port:', process.env.DB_PORT || '3306');
  console.log('User:', process.env.DB_USER || 'mysql_user');
  console.log('Password:', process.env.DB_PASSWORD ? '***' : '(not set)');
  console.log('');

  let connection;

  try {
    // Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'mysql_user',
      password: process.env.DB_PASSWORD || 'mysql_password',
    });

    console.log('✅ Connection successful!');

    const [rows] = await connection.query('SELECT NOW() as now');
    console.log('Server time:', rows[0].now);

    // Check if database exists
    const dbName = process.env.DB_NAME || 'employee_db';
    const [databases] = await connection.query(
      'SHOW DATABASES LIKE ?',
      [dbName]
    );

    if (databases.length === 0) {
      console.log(`\n⚠️  Database "${dbName}" does not exist.`);
      console.log('Creating database...');
      await connection.query(`CREATE DATABASE ${dbName}`);
      console.log('✅ Database created successfully!');
    } else {
      console.log(`✅ Database "${dbName}" exists.`);
    }

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure MySQL is running (or start Docker: docker-compose up -d)');
    console.error('2. Check your credentials in backend/.env file');
    console.error('3. Try connecting with: mysql -u root -p');
    console.error('4. Verify port is correct (3307 for Docker, 3306 for local)');
    if (connection) await connection.end();
    process.exit(1);
  }
}

testConnection();

