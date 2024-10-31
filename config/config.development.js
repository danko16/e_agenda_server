const config = require('./config.global');
config.documents = 'public/documents';
config.uploads = 'public/uploads';
config.serverDomain = 'https://e-agenda.online';
config.clientDomain = 'https://e-agenda.online';
config.host = 'http://localhost';
config.port = 3000;
config.googleId = '716047596348-5u7a8njt55pq5ds69gsqd4o36af2qni9.apps.googleusercontent.com';
config.googleSecret = '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';
config.jwtsecret = `bqDpM5CUo+/2JtTXPpztCvZuSSzHVYOSu+wX4kYCMwi9WKlcpk1wScDsgw0oCV4E`;
config.aessecret = 'WN81NXQxXhSgzyqET6+56faTIUaHlJzfNLaTMEE+jNQxy8+VcydOwDLO9l9ttpHH';
config.db = {
  username: 'danang',
  password: 'mq3b(@.TqLy^4#B',
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
