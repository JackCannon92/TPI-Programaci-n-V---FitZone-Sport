const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Usuario = sequelize.define('Usuario', {
        id: { 
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        dni: {
            type: DataTypes.STRING(15),
            allowNull: false,
            unique: true
        },
        nombre_completo: {
            type: DataTypes.STRING(120),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(160),
            allowNull: false,
            unique: true,
        },
        telefono: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        foto_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        tipo: {
            type: DataTypes.ENUM('SOCIO', 'CLIENTE_EXTERNO'),
            allowNull: false,
        },
        rol: {
            type: DataTypes.ENUM('CLIENTE', 'RECEPCIONISTA', 'GERENTE'),
            allowNull: false,
            defaultValue: 'CLIENTE'
        }
    }, {
      tableName: 'usuarios',
      timestamps: true,
      paranoid: true, // <-- Activa el Soft Delete
      underscored: true // Convierte automáticamente createdAt a created_at

    });
    
    return Usuario;
};