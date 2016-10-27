module.exports = {
  base_url: process.env.BASE_URL,
  db: 'mongo',
  auth: {
    request_code_length: +process.env.REQUEST_CODE_LENGTH || 32,
    google: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET
    },
    facebook: {
      client_id: process.env.FACEBOOK_CLIENT_ID,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET
    }
  },
  secrets: {
    jwt: process.env.JWT_SECRET
  },
  crypto: {
    bcrypt_salt_factor: +process.env.BCRYPT_SALT_FACTOR || 8
  }
};