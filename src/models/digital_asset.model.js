module.exports = function (sequelize, DataTypes) {
  const DigitalAssets = sequelize.define(
    "digital_assets",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      path: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      filename: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      url: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      user_id: {
        allowNull: true,
        foreignKey: true,
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
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
    {
      timestamps: true,
      underscored: true,
    }
  );

  DigitalAssets.associate = function (models) {
    DigitalAssets.belongsTo(models.users, {
      foreignKey: "user_id",
    });
  };

  return DigitalAssets;
};
