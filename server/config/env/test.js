module.exports = {
  port: 4000,
  logs: {
    level: process.env.LOG_LEVEL || 'debug'
  },
  mongo: {
    uri: 'mongodb://localhost/boards-test'
  },
  auth: {
    request_code_length: 32,
    google: {
      client_id: 'google_client_id',
      client_secret: 'google_client_secret'
    },
    facebook: {
      client_id: 'facebook_client_id',
      client_secret: 'facebook_client_secret'
    },
    github: {
      client_id: 'github_client_id',
      client_secret: 'github_client_secret'
    }
  },
  secrets: {
    jwt: 'jwt_secret'
  },
  crypto: {
    bcrypt_salt_factor: 8
  }
};