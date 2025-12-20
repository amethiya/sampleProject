# Database Setup Guide

## Fixing MySQL Authentication Error

If you're getting an authentication error, follow these steps:

### Option 1: Use Docker (Recommended)

The easiest way is to use Docker with the provided configuration:

```bash
# Start MySQL container
docker-compose up -d

# Verify it's running
docker-compose ps

# Check logs
docker-compose logs mysql
```

The `.env` file should be:
```
DB_HOST=localhost
DB_PORT=3307
DB_USER=mysql_user
DB_PASSWORD=mysql_password
DB_NAME=employee_db
```

### Option 2: Set MySQL Password (Manual Installation)

If you have MySQL installed locally:

1. **Connect to MySQL**:
   ```bash
   mysql -u root -p
   ```

2. **Create database and user**:
   ```sql
   CREATE DATABASE employee_db;
   CREATE USER 'mysql_user'@'localhost' IDENTIFIED BY 'mysql_password';
   GRANT ALL PRIVILEGES ON employee_db.* TO 'mysql_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Update your `.env` file** in the backend folder:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=mysql_user
   DB_PASSWORD=mysql_password
   DB_NAME=employee_db
   ```

### Option 3: Use Root User

1. **Update `.env` file**:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_root_password
   DB_NAME=employee_db
   ```

2. **Create database**:
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS employee_db;"
   ```

### Test Your Connection

After updating `.env`, test the connection:

```bash
cd backend
node test-db-connection.js
```

If successful, you'll see:
```
✅ Connection successful!
✅ Database "employee_db" exists.
```

Then start your server:
```bash
npm run dev
```


