'use strict';
const { DataTypes } = require('sequelize');
const { TipoCancha, EstadoCancha } = require('../../common/enums');

module.exports = (sequelize) => {
  const Cancha = sequelize.define(
    'Cancha',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      sedeId: { type: DataTypes.UUID, allowNull: false, field: 'sede_id' },
      nombre: { type: DataTypes.STRING(60), allowNull: false },
      tipo: { type: DataTypes.ENUM(...Object.values(TipoCancha)), allowNull: false },
      precioHora: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      estado: { type: DataTypes.ENUM(...Object.values(EstadoCancha)), allowNull: false, defaultValue: EstadoCancha.DISPONIBLE },
    },
    { tableName: 'canchas', timestamps: true , underscored: true}
  );
  return Cancha;
};