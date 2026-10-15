const exitOriginal = process.exit;
process.exit = function(codigo) {
    console.error(`\n🚨 ALGUIEN ORDENÓ APAGAR EL SERVIDOR CON CÓDIGO: ${codigo} 🚨`);
    console.trace("📍 RASTRO EXACTO DEL ARCHIVO Y LÍNEA:");
    exitOriginal(codigo);
};
require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./core/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // 1. Conecta a la base de datos
        await sequelize.authenticate();
        console.log('✅ Conexión a PostgreSQL (Supabase) establecida con éxito.');
        
        // // 2. Sincroniza las tablas
        // await sequelize.sync({ alter: true });
        // console.log('Tablas sincronizadas correctamente en PostgreSQL.');
        
        // 2. Enciende el servidor web
        app.listen(PORT, () => {
            console.log(`🚀 Servidor de FitZone corriendo en http://localhost:${PORT}`);
        // setInterval(() => console.log('💓 El servidor sigue vivo...'), 5000);
        });
    } catch (error) {
        console.error('❌ Error al arrancar el sistema:', error.message);
    }
};
process.on('uncaughtException', (err) => {
    console.error('🔥 CRASH FATAL (Excepción no atrapada):', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 CRASH FATAL (Promesa rechazada no manejada):', reason);
});

startServer();