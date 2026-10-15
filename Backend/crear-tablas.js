'use strict';

// Este script se conecta a la base (la que tengas puesta en tu .env,
// la Supabase del equipo) y crea o actualiza las tablas para que
// coincidan con los modelos de Sequelize del backend. Se corre UNA
// SOLA VEZ (o cada vez que alguien agregue un campo nuevo a un modelo).
// No borra nada de lo que ya haya cargado.

require('dotenv').config();
const { sequelize } = require('./src/core/db');

console.log('Conectando y creando las tablas... esperá unos segundos.');

sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Listo. Las tablas ya existen en la base de datos.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Hubo un error creando las tablas:', error.message);
    process.exit(1);
  });
