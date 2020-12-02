const mysql = require('think-model-mysql');

module.exports = {
  handle: mysql,
  database: 'nideshop',
  prefix: 'nideshop_',
  encoding: 'utf8mb4',
  host: 'www.ioliz.com',
  port: '3306',
  user: 'root',
  password: 'szsong100',
  dateStrings: true
};
