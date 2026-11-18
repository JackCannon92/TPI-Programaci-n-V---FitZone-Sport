'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ListaEspera = sequelize.define('ListaEspera', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    claseId: { type: DataTypes.UUID, allowNull: false, field: 'clase_id' },
    usuarioId: { type: DataTypes.UUID, allowNull: false, field: 'usuario_id' },
    notificado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    tableName: 'lista_espera',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ unique: true, fields: ['clase_id', 'usuario_id'] }],
  });
  
  return ListaEspera;
};