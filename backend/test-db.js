const mysql = require('mysql2/promise');

async function test() {
  try {
    console.log('Connecting to MySQL at 127.0.0.1:3308...');
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3308,
      user: 'root',
      password: 'rahasia',
    });
    console.log('Connected successfully to MySQL server!');
    await connection.query('CREATE DATABASE IF NOT EXISTS `dexa`;');
    console.log('Database `dexa` is ready.');
    await connection.end();
  } catch (err) {
    console.error('MySQL connection error:', err.message);
    process.exit(1);
  }
}

test();
