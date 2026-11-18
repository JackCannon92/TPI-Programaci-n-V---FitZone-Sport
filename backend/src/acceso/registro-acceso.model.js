'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RegistroAcceso = sequelize.define(
    'RegistroAcceso',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      usuarioId: { type: DataTypes.UUID, allowNull: false, field: 'usuario_id' },
      sedeId: { type: DataTypes.UUID, allowNull: false, field: 'sede_id' },
      fechaIngreso: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'fecha_ingreso' },
      fechaEgreso: { type: DataTypes.DATE, allowNull: true, field: 'fecha_egreso' },
    },
    { 
      tableName: 'registros_acceso', 
      timestamps: true, 
      underscored: true // Traduce automáticamente createdAt/updatedAt a snake_case
    }
  );
  return RegistroAcceso;
};