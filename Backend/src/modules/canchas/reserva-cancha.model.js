'use strict';
const { DataTypes } = require('sequelize');
const { EstadoReservaCancha } = require('../../common/enums');

module.exports = (sequelize) => {
  const ReservaCancha = sequelize.define(
    'ReservaCancha',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      canchaId: { type: DataTypes.UUID, allowNull: false, field: 'cancha_id' },
      usuarioId: { type: DataTypes.UUID, allowNull: false, field: 'usuario_id' },
      fechaHoraInicio: { type: DataTypes.DATE, allowNull: false, field: 'fecha_hora_inicio' },
      fechaHoraFin: { type: DataTypes.DATE, allowNull: false, field: 'fecha_hora_fin' },
      precioFinal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      detallePrecio: { type: DataTypes.JSON, allowNull: true },
      estado: { type: DataTypes.ENUM(...Object.values(EstadoReservaCancha)), allowNull: false, defaultValue: EstadoReservaCancha.PENDIENTE_PAGO },
    },
    {
      tableName: 'reservas_cancha',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'uq_reserva_cancha_turno_activo',
          unique: true,
          fields: ['cancha_id', 'fecha_hora_inicio'],
          where: { estado: [EstadoReservaCancha.PENDIENTE_PAGO, EstadoReservaCancha.CONFIRMADA] },
        },
      ],
    }
  );
  return ReservaCancha;
};