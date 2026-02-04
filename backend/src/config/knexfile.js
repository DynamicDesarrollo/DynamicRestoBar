const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const knexConfig = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'dynamicrestobar',
    },
    migrations: {
      directory: path.join(__dirname, '../../database/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '../../database/seeds'),
    },
    pool: {
      min: 2,
      max: 10,
    },
    timezone: 'UTC',
  },
  test: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'dynamicrestobar_test',
    },
    migrations: {
      directory: path.join(__dirname, '../../database/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '../../database/seeds'),
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: path.join(__dirname, '../../database/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '../../database/seeds'),
    },
    pool: {
      min: 2,
      max: 20,
    },
    timezone: 'UTC',
  },
};

module.exports = knexConfig;
