const jwt = require("jsonwebtoken");
const { users: User } = require("../models");
const config = require("../../config");

const isAllow = async (req, res, next) => {
  let token = req.headers["x-token"];
  if (!token) {
    return res
      .status(401)
      .json({ status: 401, message: "Sorry, Authentication required! :(" });
  }
  try {
    token = token.split(" ")[1];
    if (!token)
      return res.status(401).json({ status: 401, message: "Invalid Token!" });

    const decoded = await jwt.verify(
      token,
      config.jwtsecret
    );

    let user;
    user = await User.findOne({ where: { id: decoded.uid } });

    if (!user) {
      return res.status(401).json({ status: 401, message: "User not found!" });
    }
    res.locals.user = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      no_telp: user.no_telp,
    };
    next();
  } catch (error) {
    console.log(error);
    return res
      .status(401)
      .json({ status: 401, message: "Something Wrong!", error });
  }
};

const parseUser = async (data) => {
  return {
    id: user._id,
    nama: user.nama,
    email: user.email,
    no_telp: user.no_telp,
  };
};

module.exports = { isAllow, parseUser };
