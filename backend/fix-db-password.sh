#!/bin/bash

echo "=========================================="
echo "PostgreSQL Password Setup Helper"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_db
DB_USER=postgres
DB_PASSWORD=
PORT=5000
EOF
    echo "✅ Created .env file"
fi

echo ""
echo "To fix the password authentication error, you need to:"
echo ""
echo "1. Connect to PostgreSQL and set a password:"
echo "   psql -U postgres"
echo ""
echo "2. In the PostgreSQL prompt, run:"
echo "   ALTER USER postgres WITH PASSWORD 'your_password';"
echo ""
echo "3. Update the .env file with your password:"
echo "   DB_PASSWORD=your_password"
echo ""
echo "OR if you can't connect with 'postgres' user, try:"
echo ""
echo "1. Connect with your system user:"
echo "   psql postgres"
echo ""
echo "2. Create the postgres user with password:"
echo "   CREATE USER postgres WITH PASSWORD 'postgres';"
echo "   ALTER USER postgres CREATEDB;"
echo ""
echo "3. Update .env:"
echo "   DB_USER=postgres"
echo "   DB_PASSWORD=postgres"
echo ""
echo "After updating .env, test the connection:"
echo "   node test-db-connection.js"
echo ""

