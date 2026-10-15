'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Sede = sequelize.define('Sede', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        nombre: {
            type: DataTypes.STRING(80),
            allowNull: false,
            unique: true
        },
        direccion: {
            type: DataTypes.STRING(160)
        },
        aforoMaximo: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 100,
            field: 'aforo_maximo' // Le dice a Sequelize cómo se llama la columna real en Postgres
        },
        activa: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'sedes',
        timestamps: true,
        underscored: true // Traduce automáticamente createdAt/updatedAt a created_at/updated_at
    });

    return Sede;
};