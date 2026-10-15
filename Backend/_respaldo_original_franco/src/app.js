const express = require('express');
const cors = require('cors');
const setupSwagger = require('./core/swagger');
const setupCompositionRoot = require('./core/compositionRoot');

const app = express();

// 1. Inicializamos el ensamblador central UNA SOLA VEZ
const routers = setupCompositionRoot();

// Middlewares globales
app.use(cors());
app.use(express.json()); // Permite recibir JSON en los POST/PUT

setupSwagger(app);

// Ruta básica de prueba (Healthcheck)
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API de FitZone Sports funcionando 🚀' });
});

// 2. Conectamos las rutas a sus URLs correspondientes
app.use('/api/usuarios', routers.usuariosRouter);
app.use('/api/membresias', routers.membresiasRouter);
app.use('/api/sedes', routers.sedesRouter);
app.use('/api/acceso', routers.accesoRouter);
app.use('/api/canchas', routers.canchasRouter);
app.use('/api/clases', routers.clasesRouter);
// 3. Módulos pendientes (Comentados)

app.use('/api/pagos', routers.pagosRouter);

// Middleware global para manejo de errores
app.use((err, req, res, next) => {
    // Imprimimos el error limpio en la consola del servidor
    console.error("🛑 Regla de negocio o error:", err.message);
    
    // Si el error trae un status lo usamos, de lo contrario asumimos que es un error de validación/negocio (400)
    const statusCode = err.status || 400;
    
    // Le devolvemos el mensaje exacto al frontend/Swagger para que sepa qué corregir
    res.status(statusCode).json({ 
        error: err.message || 'Error interno del servidor.' 
    });
});

module.exports = app;