'use strict';

/**
 * Exporta el contrato OpenAPI a swagger.json (lo pide el punto 4 de los lineamientos).
 * Lee los mismos comentarios @swagger que publica /api-docs, así que el archivo y la
 * documentación en vivo no pueden diferir.
 *
 * Uso: npm run swagger:export
 */
const fs = require('fs');
const path = require('path');

process.chdir(path.join(__dirname, '..')); // swagger-jsdoc busca las rutas desde la carpeta del backend
const { swaggerSpec } = require('../src/core/swagger');

// Rutas en orden alfabético: el archivo sale igual en Windows y en Linux (el pipeline lo compara).
const paths = Object.fromEntries(Object.entries(swaggerSpec.paths || {}).sort(([a], [b]) => a.localeCompare(b)));
const contrato = { ...swaggerSpec, paths };

const destino = path.join(__dirname, '..', 'swagger.json');
fs.writeFileSync(destino, `${JSON.stringify(contrato, null, 2)}\n`);
console.log(`swagger.json exportado: ${Object.keys(paths).length} rutas → ${destino}`);
