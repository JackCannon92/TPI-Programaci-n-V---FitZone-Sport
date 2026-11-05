'use strict';

/**
 * Middleware global de manejo de errores.
 *
 * Estaba escrito dentro de app.js; vive acá para que los tests de integración
 * (Supertest) monten un router con el MISMO manejo de errores que la API real.
 *
 * Si el error trae un status (AppError, o los errores de dominio como
 * TurnoYaReservadoError) lo usamos; si no, asumimos un error de negocio o de
 * validación (400).
 */
function manejarErrores({ logger = console } = {}) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    logger.error('🛑 Regla de negocio o error:', err.message);
    const statusCode = err.status || 400;
    res.status(statusCode).json({ error: err.message || 'Error interno del servidor.' });
  };
}

module.exports = { manejarErrores };
