const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configuración básica de la página de documentación
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API FitZone Sports',
            version: '1.0.0',
            description: 'Documentación interactiva del Trabajo Integrador (Módulo 1)',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor Local'
            },
        ],
    },
    // Le indicamos dónde buscar los comentarios de la API (
    apis: ['./src/modules/**/*.routes.js'], 
};

// Generamos el JSON con las especificaciones
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Función para inyectar la interfaz gráfica en Express
const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;