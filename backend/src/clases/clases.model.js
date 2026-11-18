'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Clase = sequelize.define('Clase', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sedeId: { type: DataTypes.UUID, allowNull: false, field: 'sede_id' },
    tipo: { type: DataTypes.STRING(60), allowNull: false },
    instructor: { type: DataTypes.STRING(80), allowNull: false },
    fechaHora: { type: DataTypes.DATE, allowNull: false, field: 'fecha_hora' },
    capacidadMaxima: { type: DataTypes.INTEGER, allowNull: false,field: 'capacidad_maxima' },
    cuposDisponibles: { type: DataTypes.INTEGER, allowNull: false, field: 'cupos_disponibles'  },
  }, { tableName: 'clases', timestamps: true,createdAt: 'created_at', updatedAt: 'updated_at'});
  
  return Clase;
};