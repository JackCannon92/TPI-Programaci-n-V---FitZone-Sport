'use strict';

// ==========================================
// 1. IMPORTAR BASE DE DATOS Y MODELOS
// ==========================================
const { 
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
} = require('./db');

// ==========================================
// 2. IMPORTAR CAPA DE SERVICIOS
// ==========================================
const { crearUsuariosService } = require('../modules/usuarios/usuarios.service');
const { crearMembresiasService } = require('../modules/membresias/membresias.service');
const { crearSedesService } = require('../modules/sedes/sede.service'); 
const { crearAccesoService } = require('../modules/acceso/acceso.service');
const { crearCanchasService } = require('../modules/canchas/canchas.service');
const { crearClasesService } = require('../modules/clases/clases.service');
const { crearPagosService } = require('../modules/pagos/pagos.service');
const { crearPasarelaMock } = require('../modules/pagos/pasarela-mock');

// ==========================================
// 3. IMPORTAR CAPA DE CONTROLADORES
// ==========================================
const { crearUsuariosController } = require('../modules/usuarios/usuarios.controller');
const { crearMembresiasController } = require('../modules/membresias/membresias.controller');
const { crearSedesController } = require('../modules/sedes/sede.controller');
const { crearAccesoController } = require('../modules/acceso/acceso.controller');
const { crearCanchasController } = require('../modules/canchas/canchas.controller');
const { crearClasesController } = require('../modules/clases/clases.controller');
const { crearPagosController } = require('../modules/pagos/pagos.controller');


// ==========================================
// 4. IMPORTAR CAPA DE RUTAS
// ==========================================
const { crearUsuariosRouter } = require('../modules/usuarios/usuarios.routes');
const { crearMembresiasRouter } = require('../modules/membresias/membresias.routes');
const { crearSedesRouter } = require('../modules/sedes/sede.routes');
const { crearAccesoRouter } = require('../modules/acceso/acceso.routes');
const { crearCanchasRouter } = require('../modules/canchas/canchas.routes');
const { crearClasesRouter } = require('../modules/clases/clases.routes');
const { crearPagosRouter } = require('../modules/pagos/pagos.routes');

const setupCompositionRoot = () => {
    


    // ------------------------------------------
    // B. INYECCIÓN EN SERVICIOS (Lógica)
    // ------------------------------------------
    // Nivel 1: Sin dependencias de otros servicios
    const sedesService = crearSedesService({ SedeModel: Sede }); 
    const usuariosService = crearUsuariosService({ UsuarioModel: Usuario, MembresiaModel: Membresia, sequelize });

    // Nivel 2: Dependen de Nivel 1
    const membresiasService = crearMembresiasService({ MembresiaModel: Membresia, usuariosService });
    
const accesoService = crearAccesoService({ 
    usuariosService, 
    sedesService, 
    RegistroAccesoModel: RegistroAcceso 
});

    const canchasService = crearCanchasService({
        CanchaModel: Cancha,
        ReservaCanchaModel: ReservaCancha,
        usuariosService,
        sedesService
    });

    const clasesService = crearClasesService({
        ClaseModel: Clase,
        ReservaClaseModel: ReservaClase,
        ListaEsperaModel: ListaEspera,
        usuariosService,
        sedesService,
        sequelize 
    });
    
    const pasarela = crearPasarelaMock();
   
    // Nivel 3: Dependen de Nivel 2 y Sistemas Externos
    const pagosService = crearPagosService({
        PagoModel: Pago,
        canchasService,
        usuariosService,
        sedesService,
        pasarela
    });
    

    // ------------------------------------------
    // C. INYECCIÓN EN CONTROLADORES
    // ------------------------------------------
    const usuariosController = crearUsuariosController(usuariosService);
    const membresiasController = crearMembresiasController(membresiasService);
    const sedesController = crearSedesController(sedesService);
    const accesoController = crearAccesoController(accesoService);
    const canchasController = crearCanchasController(canchasService);
    const clasesController = crearClasesController(clasesService);
    const pagosController = crearPagosController(pagosService);

    // ------------------------------------------
    // D. INYECCIÓN EN RUTAS
    // ------------------------------------------
    const usuariosRouter = crearUsuariosRouter(usuariosController);
    const membresiasRouter = crearMembresiasRouter(membresiasController);
    const sedesRouter = crearSedesRouter(sedesController);
    const accesoRouter = crearAccesoRouter(accesoController);
    const canchasRouter = crearCanchasRouter(canchasController);
    const clasesRouter = crearClasesRouter(clasesController);
    const pagosRouter = crearPagosRouter(pagosController);

    // Retornamos todas las rutas listas para ser montadas en Express
    return {
        usuariosRouter,
        membresiasRouter,
        sedesRouter,
        accesoRouter,
        canchasRouter,
        clasesRouter,
        pagosRouter
    };
};

module.exports = setupCompositionRoot;