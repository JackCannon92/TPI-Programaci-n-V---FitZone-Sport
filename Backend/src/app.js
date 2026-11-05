const express = require('express');
const cors = require('cors');
const setupSwagger = require('./core/swagger');
const setupCompositionRoot = require('./core/compositionRoot');
const { manejarErrores } = require('./core/errorHandler');

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
app.use('/api/pagos', routers.pagosRouter);

// Middleware global para manejo de errores (core/errorHandler.js)
app.use(manejarErrores());

module.exports = app;