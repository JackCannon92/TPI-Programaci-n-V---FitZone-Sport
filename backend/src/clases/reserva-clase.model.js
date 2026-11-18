'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReservaClase = sequelize.define('ReservaClase', {
    id: { 
      type: DataTypes.UUID, 
      defaultValue: DataTypes.UUIDV4, 
      primaryKey: true 
    },
    claseId: { 
      type: DataTypes.UUID, 
      allowNull: false, 
      field: 'clase_id' 
    },
    usuarioId: { 
      type: DataTypes.UUID, 
      allowNull: false, 
      field: 'usuario_id' 
    },
    estado: { 
      type: DataTypes.STRING(30), 
      allowNull: false,
      defaultValue: 'CONFIRMADA'
    }
  }, { 
    tableName: 'reservas_clase',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return ReservaClase;
};