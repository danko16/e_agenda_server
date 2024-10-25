const express = require("express");
const { sequelize, Sequelize } = require("../models");
const { query, body, validationResult } = require("express-validator");
const { kegiatan: Kegiatan, digital_assets: Asset } = require("../models");
const {
  auth: { isAllow },
  response,
} = require("../utils");
const Op = Sequelize.Op;

const router = express.Router();

router.get(
  "/",
  isAllow,
  [
    query("tanggal_awal", "Tanggal awal tidak boleh kosong").exists(),
    query("tanggal_akhir", "Tanggal akhir tidak boleh kosong").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }
    const query = req.query;

    try {
      let tangalAwal = new Date(query.tanggal_awal);
      let tanggalAkhir = new Date(query.tanggal_akhir);

      const kegiatan = await Kegiatan.findAll({
        attributes: { exclude: ["createdAt", "updatedAt"] },
        where: {
          tanggal: {
            [Op.between]: [tangalAwal, tanggalAkhir],
          },
        },
      });

      return res
        .status(200)
        .json(response(200, "Berhasil Mendapatkan Kegiatan", kegiatan));
    } catch (error) {
      console.log(error);
      return res.status(500).json(response(500, "Internal Server Error!"));
    }
  }
);

router.post(
  "/",
  isAllow,
  [
    body("judul", "Judul Kegiatan Tidak Boleh Kosong").exists(),
    body("pic", "pic Tidak Boleh Kosong").exists(),
    body("tanggal", "tanggal Tidak Boleh Kosong").exists(),
    body("jam", "jam Tidak Boleh Kosong").exists(),
    body("tempat", "tempat Tidak Boleh Kosong").exists(),
    body(
      "pelaksana_kegiatan",
      "pelaksana kegiatan Tidak Boleh Kosong"
    ).exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const body = req.body;

    const transaction = await sequelize.transaction();
    try {
      let myDate = new Date(body.tanggal);

      let kegiatan = await Kegiatan.findOne({
        where: { judul: body.judul, tanggal: myDate },
      });

      if (kegiatan) {
        return res.status(400).json(response(400, "Kegiatan telah ada"));
      }
      await Kegiatan.create(
        {
          judul: body.judul,
          pic: body.pic,
          tanggal: myDate,
          jam: body.jam,
          tempat: body.tempat,
          pelaksana_kegiatan: body.pelaksana_kegiatan,
        },
        { transaction }
      );
      await transaction.commit();
      return res
        .status(201)
        .json(response(201, "Berhasil menambahkan kegiatan"));
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(response(500, "Internal Server Error!"));
    }
  }
);

router.patch(
  "/",
  isAllow,
  [
    body("id_kegiatan", "ID Kegiatan Tidak Boleh Kosong").exists(),
    body("judul", "Judul Kegiatan Tidak Boleh Kosong").exists(),
    body("pic", "pic Tidak Boleh Kosong").exists(),
    body("tanggal", "tanggal Tidak Boleh Kosong").exists(),
    body("jam", "jam Tidak Boleh Kosong").exists(),
    body("tempat", "tempat Tidak Boleh Kosong").exists(),
    body(
      "pelaksana_kegiatan",
      "pelaksana kegiatan Tidak Boleh Kosong"
    ).exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const body = req.body;

    const transaction = await sequelize.transaction();
    try {
      let kegiatan = await Kegiatan.findOne({
        where: { id: body.id_kegiatan },
      });

      let myDate = new Date(body.tanggal);

      if (!kegiatan) {
        return res.status(400).json(response(400, "Kegiatan Tidak ditemukan"));
      }

      await kegiatan.update(
        {
          judul: body.judul,
          pic: body.pic,
          tanggal: myDate,
          jam: body.jam,
          tempat: body.tempat,
          pelaksana_kegiatan: body.pelaksana_kegiatan,
        },
        { transaction }
      );
      await transaction.commit();
      return res.status(201).json(response(201, "Berhasil update kegiatan"));
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      return res.status(500).json(response(500, "Internal Server Error!"));
    }
  }
);

router.delete(
  "/",
  isAllow,
  [body("id_kegiatan", "ID Kegiatan Tidak Boleh Kosong").exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(response(422, errors.array()));
    }

    const { user } = res.locals;
    const body = req.body;

    const transaction = await sequelize.transaction();
    try {
      let kegiatan = await Kegiatan.findOne({
        where: { id: body.id_kegiatan },
      });

      if (!kegiatan) {
        return res.status(400).json(response(400, "Kegiatan Tidak ditemukan"));
      }

      await kegiatan.destroy();
      await transaction.commit();
      return res.status(201).json(response(201, "Berhasil menghapus kegiatan"));
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      return res.status(500).json(response(500, "Internal Server Error!"));
    }
  }
);

module.exports = router;
