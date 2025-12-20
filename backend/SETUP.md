# Database Setup Guide

## Fixing PostgreSQL Password Authentication Error

If you're getting a password authentication error, follow these steps:

### Option 1: Set PostgreSQL Password (Recommended)

1. **Connect to PostgreSQL** (try one of these):
   ```bash
   psql -U postgres
   # OR
   psql postgres
   # OR  
   psql -U $(whoami)
   ```

2. **If connection succeeds**, set a password:
   ```sql
   ALTER USER postgres WITH PASSWORD 'your_password_here';
   ```

3. **Update your `.env` file** in the backend folder:
   ```
   DB_PASSWORD=your_password_here
   ```

### Option 2: Use Your System User

If PostgreSQL is configured to use your system user:

1. **Update `.env` file**:
   ```
   DB_USER=vivek.a
   DB_PASSWORD=
   ```

### Option 3: Reset PostgreSQL Password

If you can't remember the password:

1. **Stop PostgreSQL**:
   ```bash
   brew services stop postgresql
   # OR
   pg_ctl -D /usr/local/var/postgres stop
   ```

2. **Start PostgreSQL in single-user mode**:
   ```bash
   postgres --single -D /usr/local/var/postgres postgres
   ```

3. **In the PostgreSQL prompt**, run:
   ```sql
   ALTER USER postgres WITH PASSWORD 'newpassword';
   \q
   ```

4. **Restart PostgreSQL normally**:
   ```bash
   brew services start postgresql
   ```

### Option 4: Create Database with Current User

If you can connect with your system user:

1. **Connect**:
   ```bash
   psql postgres
   ```

2. **Create database and user**:
   ```sql
   CREATE DATABASE employee_db;
   CREATE USER postgres WITH PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE employee_db TO postgres;
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

