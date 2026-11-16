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

// 2. Conectamos las rutas. ADR-011: la API se versiona por URL (/api/v1).
//    /api queda como alias de la v1 mientras el frontend y la documentación migran.
const v1 = express.Router();
v1.use('/usuarios', routers.usuariosRouter);
v1.use('/membresias', routers.membresiasRouter);
v1.use('/sedes', routers.sedesRouter);
v1.use('/acceso', routers.accesoRouter);
v1.use('/canchas', routers.canchasRouter);
v1.use('/clases', routers.clasesRouter);
v1.use('/pagos', routers.pagosRouter);
app.use('/api/v1', v1);
app.use('/api', v1);

// Middleware global para manejo de errores (core/errorHandler.js)
app.use(manejarErrores());

module.exports = app;