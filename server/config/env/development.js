module.exports = {
  port: 3000,
  logs: {
    level: process.env.LOG_LEVEL || 'debug'
  },
  mongo: {
    uri: 'mongodb://localhost/boards-dev'
  }
};