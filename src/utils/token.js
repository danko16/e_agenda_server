const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../../config');

const encrypt = (pass) => {
  const hash = crypto
    .createHmac('sha256', pass)
    .update('83hgo3gh93uqogy8o4bhg3qngo39gibg934nu')
    .digest('hex');
  return hash;
};

const getToken = async (payload) => {
  try {
    let token;
    if (payload.rememberMe) {
      token = await jwt.sign(payload, config.jwtsecret, { expiresIn: '4d' });
    } else {
      token = await jwt.sign(payload, config.jwtsecret, { expiresIn: '1d' });
    }
    return token;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getPayload = async (token) => {
  try {
    let verified = await jwt.verify(token, config.jwtsecret, function (err, decoded) {
      if (err) return false;
      else return decoded;
    });
    return verified;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = {
  encrypt,
  getPayload,
  getToken,
};
