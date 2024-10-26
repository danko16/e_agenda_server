const express = require("express");
const sequelize = require("sequelize");
const multer = require("multer");
const sharp = require("sharp");
const { body, validationResult } = require("express-validator");
const config = require("../../config");
const {
  token: { encrypt, getToken, getPayload },
  auth: { isAllow },
  response,
} = require("../utils");
const { users: User, digital_assets: Asset } = require("../models");
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
        })
      );

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
        let asset = await Asset.findOne({
          where: { user_id: user.id },
        });

        if (asset) {
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

      asset = await Asset.findOne({
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

module.exports = router;
