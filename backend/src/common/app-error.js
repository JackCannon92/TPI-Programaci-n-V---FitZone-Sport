'use strict';

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    // El manejador de errores de app.js lee `err.status`. Sin esta línea, todo
    // AppError salía como 400 aunque se lanzara con 404, 403 o 409 (RN-02).
    this.status = statusCode;
  }
}

module.exports = { AppError };
