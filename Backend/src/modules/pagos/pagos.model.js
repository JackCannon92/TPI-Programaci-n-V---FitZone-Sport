'use strict';
const { DataTypes } = require('sequelize');
const { EstadoPago } = require('../../common/enums');

module.exports = (sequelize) => {
  const Pago = sequelize.define('Pago', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      usuarioId: { type: DataTypes.UUID, allowNull: false, field: 'usuario_id' },
      
      // Polimorfismo: Permitimos nulos en ambos para que un pago aplique a uno u otro
      reservaCanchaId: { type: DataTypes.UUID, allowNull: true, field: 'reserva_cancha_id' },
      membresiaId: { type: DataTypes.UUID, allowNull: true, field: 'membresia_id' },
      
      monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      estado: { type: DataTypes.ENUM(...Object.values(EstadoPago)), allowNull: false },
      tokenPasarela: { type: DataTypes.STRING(80), allowNull: false, field: 'token_pasarela' },
      ultimos4: { type: DataTypes.STRING(4), allowNull: true },
      motivoRechazo: { type: DataTypes.STRING(120), allowNull: true,field: 'motivo_rechazo' },
    },
    { tableName: 'pagos', timestamps: true,createdAt: 'created_at',updatedAt: 'updated_at' }
  );

  return Pago;
};