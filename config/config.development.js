const config = require('./config.global');
config.documents = 'public/documents';
config.uploads = 'public/uploads';
config.serverDomain = 'http://localhost:3000';
config.clientDomain = 'http://localhost:3006';
config.host = 'http://localhost';
config.port = 3000;
config.googleId = '';
config.googleSecret = '';
config.jwtsecret = `bqDpM5CUo+/2JtTXPpztCvZuSSzHVYOSu+wX4kYCMwi9WKlcpk1wScDsgw0oCV4E`;
config.aessecret = 'WN81NXQxXhSgzyqET6+56faTIUaHlJzfNLaTMEE+jNQxy8+VcydOwDLO9l9ttpHH';
config.db = {
  username: 'root',
  password: 'password',
  database: 'e_agenda',
  host: '127.0.0.1',
  dialect: 'mysql',
  timezone: '+07:00',
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
  },
  pool: {
    max: 50,
    min: 0,
    acquire: 1000000,
    idle: 10000,
  },
};

module.exports = config;
