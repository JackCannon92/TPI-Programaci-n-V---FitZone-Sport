const { DataTypes } = require('sequelize'); 
module.exports = (sequelize) => {
    const Membresia = sequelize.define('Membresia', {
        id: { 
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        usuario_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true, // Garantiza la cardinalidad 1 a 1
            references: {
                model: 'usuarios',
                key: 'id'
            }
        },
        plan: {
            type: DataTypes.ENUM('MENSUAL', 'TRIMESTRAL', 'ANUAL'),
            allowNull: false,
        },
        estado: {
            type: DataTypes.ENUM('ACTIVO', 'VENCIDO', 'SUSPENDIDO'),
            allowNull: false,
            defaultValue: 'ACTIVO'
        },
        fecha_inicio: {
            type: DataTypes.DATEONLY, // Ignora la hora, guarda solo la fecha
            allowNull: false
        },
        fecha_vencimiento: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        renovacion_automatica: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        tableName: 'membresias',
        timestamps: true,
        underscored: true
    });
    
    return Membresia;
};