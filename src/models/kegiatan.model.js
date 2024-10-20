module.exports = function (sequelize, DataTypes) {
  const Kegiatan = sequelize.define(
    "kegiatan",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      judul: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      pic: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      tanggal: {
        allowNull: false,
        type: DataTypes.DATEONLY,
      },
      jam: {
        allowNull: false,
        type: DataTypes.TIME,
      },
      tempat: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      pelaksana_kegiatan: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    { timestamps: true, underscored: true }
  );

  return Kegiatan;
};
