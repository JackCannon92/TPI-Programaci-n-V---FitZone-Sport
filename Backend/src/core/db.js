// 1.Cargar las variables de entorno
require('dotenv').config();
const { Sequelize } = require('sequelize');

// 2. Instanciar Sequelize con soporte SSL para Supabase
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false // Apaga el spam de consultas SQL en la terminal
});



// 3. Importar los moldes (Asegúrate de que la ruta coincida con tus carpetas)
const definirModeloUsuario = require('../modules/usuarios/usuarios.model');
const definirModeloMembresia = require('../modules/membresias/membresias.model');
const definirModeloSede = require('../modules/sedes/sede.model');
const definirModeloAcceso= require('../modules/acceso/registro-acceso.model');
const definirModeloCancha=require('../modules/canchas/canchas.model');
const definirModeloReservaCancha= require ('../modules/canchas/reserva-cancha.model');
const definirModeloClase= require ('../modules/clases/clases.model');
const definirModeloReservaClase= require('../modules/clases/reserva-clase.model');
const definirModeloListaEspera= require ('../modules/clases/lista-espera.model');
const definirModeloPago = require('../modules/pagos/pagos.model');


// 4. Inicializar los modelos en Sequelize
const Usuario = definirModeloUsuario(sequelize);
const Membresia = definirModeloMembresia(sequelize);
const Sede = definirModeloSede(sequelize);
const RegistroAcceso= definirModeloAcceso(sequelize);
const Cancha= definirModeloCancha(sequelize);
const ReservaCancha= definirModeloReservaCancha(sequelize);
const Clase= definirModeloClase(sequelize);
const ReservaClase = definirModeloReservaClase(sequelize)
const ListaEspera= definirModeloListaEspera(sequelize)
const Pago = definirModeloPago(sequelize);

// 5. Relacionar las tablas 
Usuario.hasOne(Membresia, { foreignKey: 'usuario_id', as: 'membresia' });
Membresia.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Relaciones para el control de aforo (RF-05)
RegistroAcceso.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
RegistroAcceso.belongsTo(Sede, { foreignKey: 'sede_id', as: 'sede' });

// Relaciones del Módulo de Canchas
Cancha.belongsTo(Sede, { foreignKey: 'sede_id', as: 'sede' });
Sede.hasMany(Cancha, { foreignKey: 'sede_id', as: 'canchas' });

ReservaCancha.belongsTo(Cancha, { foreignKey: 'cancha_id', as: 'cancha' });
Cancha.hasMany(ReservaCancha, { foreignKey: 'cancha_id', as: 'reservas' });

ReservaCancha.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(ReservaCancha, { foreignKey: 'usuario_id', as: 'reservas_cancha' });

// Relaciones del Módulo de Clases
Clase.belongsTo(Sede, { foreignKey: 'sede_id', as: 'sede' });
Sede.hasMany(Clase, { foreignKey: 'sede_id', as: 'clases' });

ReservaClase.belongsTo(Clase, { foreignKey: 'clase_id', as: 'clase' });
Clase.hasMany(ReservaClase, { foreignKey: 'clase_id', as: 'reservas_clase' });

ReservaClase.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(ReservaClase, { foreignKey: 'usuario_id', as: 'reservas_clase_usuario' });

ListaEspera.belongsTo(Clase, { foreignKey: 'clase_id', as: 'clase' });
Clase.hasMany(ListaEspera, { foreignKey: 'clase_id', as: 'lista_espera' });

ListaEspera.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(ListaEspera, { foreignKey: 'usuario_id', as: 'lista_espera_usuario' });

// Relaciones del Módulo de Pagos (Soporta cobro de canchas y membresías)
Pago.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Pago, { foreignKey: 'usuario_id', as: 'pagos' });

Pago.belongsTo(ReservaCancha, { foreignKey: 'reserva_cancha_id', as: 'reserva_cancha' });
ReservaCancha.hasMany(Pago, { foreignKey: 'reserva_cancha_id', as: 'pagos' });

Pago.belongsTo(Membresia, { foreignKey: 'membresia_id', as: 'membresia' });
Membresia.hasMany(Pago, { foreignKey: 'membresia_id', as: 'pagos' });

// 6. Exportamos todo junto
module.exports = { 
    sequelize, 
    Usuario, 
    Membresia,
    Sede,
    RegistroAcceso,
    Cancha,
    ReservaCancha,
    Clase,
    ReservaClase,
    ListaEspera,
    Pago
};