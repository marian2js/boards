module.exports = {
  base_url: process.env.BASE_URL,
  db: 'mongo',
  auth: {
    request_code_length: +process.env.REQUEST_CODE_LENGTH || 32
  },
  secrets: {
    jwt: process.env.JWT_SECRET
  },
  crypto: {
    bcrypt_salt_factor: +process.env.BCRYPT_SALT_FACTOR || 8
  }
};