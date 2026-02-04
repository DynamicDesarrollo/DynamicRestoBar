const knex = require('knex');
const knexConfig = require('./knexfile.js');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

const db = knex(config);

module.exports = db;
