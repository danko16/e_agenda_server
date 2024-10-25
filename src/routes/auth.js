const express = require("express");
const sequelize = require("sequelize");
const multer = require("multer");
const fs = require("fs");
const sharp = require("sharp");
const { body, query, validationResult } = require("express-validator");
const passport = require("../utils/passport");
const url = require("url");
const config = require("../../config");
const {
  token: {
    encrypt,
    getToken,
    getRegisterToken,
    checkRegisterToken,
    getPayload,
  },
  auth: { isAllow },
  response,
} = require("../utils");
const { users: User, digital_assets: Asset } = require("../models");
const { getTokenReset, checkTokenReset } = require("../utils/token");
const { sendPasswordReset, sendActivationEmail } = require("../utils/emails");
const Op = sequelize.Op;

const router = express.Router();

const storage = multer.diskStorage({
  destination: config.uploads,
  filename: function (req, file, cb) {
    cb(null, Date.now() + "." + file.mimetype.split("/")[1]);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 8000000, files: 3 },
  fileFilter: async function (req, file, cb) {
    // if (!req.body.type) {
    //   cb(new Error('Type need to be specified'));
    // }
    cb(null, true);
  },
}).single("file");

router.post("/is-allow", isAllow, async (req, res) => {
  try {
    return res.status(200).json(response(200, "Allowed!"));
  } catch (error) {
    return res.status(500).json(response(500, "Internal Server Error!"));
  }
});

router.post(
  "/register",
  [
    body("nama", "nama tidak boleh kosong")
      .exists()
      .bail()
      .matches(/^[A-Za-z\s]+$/i)
      .withMessage("nama hanya boleh diisi dengan huruf dan spasi")
      .isLength({
        min: 4,
      })
      .withMessage("panjang nama minimal 4 karakter"),
    body("email", "email tidak boleh kosong")
      .exists()
      .bail()
      .isEmail()
      .withMessage("email tidak valid"),
    body("password", "password tidak boleh kosong")
      .exists()
      .bail()
      .isLength({
        min: 6,
      })
      .withMessage("panjang password minimal 6 karakter"),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { nama, email, no_telp, password } = req.body;
    try {
      let user;
      user = await User.findOne({
        where: {
          email,
        },
      });

      if (user) {
        return res.status(400).json(response(400, "User sudah terdaftar"));
      }

      user = await User.create(
        Object.freeze({
          nama,
          email,
          no_telp,
          password: encrypt(password),
          provider: "local",
        })
      );

      const registerToken = await getRegisterToken({
        uid: user.id,
        for: "register",
      });

      const tokenUrl = `${config.serverDomain}/auth/confirm-email?token=${registerToken}&email=${user.email}`;

      sendActivationEmail({
        email: user.email,
        name: user.nama,
        tokenUrl,
      });

      const token = await getToken({ uid: user.id });
      let getExpToken = await getPayload(token.pure);

      const payload = Object.freeze({
        token: { key: token.key, exp: getExpToken.exp },
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          no_telp: user.no_telp,
          avatar: null,
        },
      });

      return res
        .status(200)
        .json(response(200, "Registrasi berhasil", payload));
    } catch (error) {
      return res
        .status(500)
        .json(response(500, "Internal Server Error!", error));
    }
  }
);
router.post(
  "/login",
  [
    body("email", "email tidak boleh kosong").exists(),
    body("password", "password tidak boleh kosong").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { email, password, remember_me } = req.body;
    try {
      let user;
      user = await User.findOne({
        where: { email },
        include: [
          {
            model: Asset,
            required: false,
          },
        ],
      });

      if (!user) {
        return res.status(400).json(response(400, "User not found!"));
      }
      let avatar = user.digital_assets.length
        ? user.digital_assets[0].dataValues.url
        : null;

      if (user.provider === "google") {
        return res.status(400).json(response(400, "Login dengan Google"));
      }

      const compare = encrypt(password) === user.password;
      if (!compare) {
        return res.status(400).json(response(400, "Password salah!"));
      }

      const token = await getToken({
        uid: user.id,
        rememberMe: remember_me,
      });
      let getExpToken = await getPayload(token.pure);

      const payload = Object.freeze({
        token: { key: token.key, exp: getExpToken.exp },
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          no_telp: user.no_telp,
          avatar,
        },
      });

      return res.status(200).json(response(200, "Login berhasil", payload));
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json(response(500, "Internal Server Error!", error));
    }
  }
);

router.post(
  "/forgot",
  [
    body("email", "email tidak boleh kosong")
      .exists()
      .bail()
      .isEmail()
      .withMessage("email tidak valid"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }
    const { email } = req.body;
    try {
      let user;
      user = await User.findOne({ where: { email } });

      if (!user) {
        return res
          .status(400)
          .json(response(400, "Anda belum terdaftar sebagai user"));
      }

      const resetPasswordToken = await getTokenReset({
        uid: user.id,
        for: "reset",
      });
      if (!resetPasswordToken) {
        return res.status(500).json(response(500, "Internal Server Error!"));
      }

      const tokenUrl = `${config.clientDomain}/reset-password?token=${resetPasswordToken}&email=${user.email}`;

      // sendPasswordReset({
      //   email: user.email,
      //   name: user.full_name,
      //   tokenUrl,
      // });

      return res
        .status(200)
        .json(
          response(
            200,
            "Silahkan check email anda untuk reset password",
            tokenUrl
          )
        );
    } catch (error) {
      return res
        .status(500)
        .json(response(500, "Internal Server Error!", error));
    }
  }
);

router.post(
  "/reset",
  [
    body("token", "token tidak boleh kosong").exists(),
    body("email", "email tidak boleh kosong").exists(),
    body("new_password", "passowrd baru tidak boleh kosong").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { token, new_password, email } = req.body;

    try {
      let user;
      user = await User.findOne({
        where: { email },
        include: {
          model: Asset,
          required: false,
        },
      });

      if (!user) {
        return res.status(400).json(response(400, "User tidak ditemukan!"));
      }

      const verifyToken = await checkTokenReset(token.replace(/ /g, "+"));
      if (!verifyToken) {
        return res.status(400).json(response(400, "Token tidak sesuai!"));
      }

      await user.update({ password: encrypt(new_password) });

      let avatar = user.digital_assets.length
        ? user.digital_assets[0].dataValues.url
        : null;

      const loginToken = await getToken({
        uid: user.id,
        rememberMe: true,
      });
      let getExpToken = await getPayload(loginToken.pure);

      const payload = Object.freeze({
        token: { key: loginToken.key, exp: getExpToken.exp },
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          no_telp: user.no_telp,
          avatar,
        },
      });

      return res
        .status(200)
        .json(response(200, "Reset password berhasil", payload));
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json(response(500, "Internal Server Error!", error));
    }
  }
);

router.patch("/profile", isAllow, async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(response(422, errors.array()));
  }

  user = await User.findOne({
    where: { id: res.locals.user.id },
    include: {
      model: Asset,
      required: false,
    },
  });

  if (!user) {
    return res.status(400).json(response(400, "User tidak ditemukan!"));
  }

  upload(req, res, async function (error) {
    try {
      if (error instanceof multer.MulterError) {
        return res
          .status(500)
          .json(response(500, "Internal Server Error!", error));
      } else if (error) {
        return res.status(500).json(response(500, "Unkonwn Error!", error));
      }
      const { file, body } = req;
      let servePath;
      let filePath;
      let urlPath;

      if (body.nama) {
        await user.update({ nama: body.nama });
      }

      if (body.no_telp) {
        await user.update({ no_telp: body.no_telp });
      }

      if (body.password) {
        await user.update({ password: encrypt(new_password) });
      }

      if (file) {
        servePath = `uploads/${file.filename}`;
        filePath = `${file.destination}/${file.filename}`;
        urlPath = `${config.serverDomain}/${servePath}`;

        const sharpFile = await sharp(filePath).toBuffer();

        sharp(sharpFile)
          .resize(245, 245)
          .toFile(filePath, (err, info) => {});
      }

      if (file) {
        const asset = await Asset.findOne({
          where: { user_id: user.id },
        });

        if (asset) {
          if (asset.path) {
            fs.unlinkSync(asset.path);
          }
          await asset.update({
            url: urlPath,
            path: filePath,
            filename: file.filename,
          });
        } else {
          await Asset.create({
            url: urlPath,
            path: filePath,
            filename: file.filename,
            user_id: user.id,
          });
        }
      }

      const asset = await Asset.findOne({
        where: { user_id: user.id },
      });
      payload = Object.freeze({
        id: user.id,
        nama: user.nama,
        email: user.email,
        no_telp: user.no_telp,
        avatar: asset ? asset.url : null,
      });

      return res
        .status(200)
        .json(response(200, "Berhasil Update Profile", payload));
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json(response(500, "Internal Server Error!", error));
    }
  });
});

router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "https://www.googleapis.com/auth/plus.login",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${config.clientDomain}/`,
  }),
  async function (req, res) {
    const { user } = req;
    const token = await getToken({
      uid: user.id,
      rememberMe: true,
    });
    let getExpToken = await getPayload(token.pure);

    res.redirect(
      url.format({
        pathname: `${config.clientDomain}/google-auth`,
        body: {
          key: token.key,
          exp: getExpToken.exp,
          id: user.id,
          nama: user.nama,
          email: user.email,
          no_telp: user.no_telp,
          avatar: user.digital_assets.length
            ? user.digital_assets[0].dataValues.url
            : null,
        },
      })
    );
  }
);

module.exports = router;
