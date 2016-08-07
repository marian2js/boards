module.exports = {
  port: 8080,
  logs: {
    level: process.env.LOG_LEVEL || 'warn'
  },
  mongo: {
    uri: 'mongodb://localhost/boards'
  }
};