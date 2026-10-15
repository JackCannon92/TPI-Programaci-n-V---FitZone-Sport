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

// Unidad III · Patrones de diseño (ver docs/ADR-007-patrones-unidad-iii.md)
// Strategy (RF-11): precio de canchas
const { crearTarifador } = require('../modules/canchas/strategies/tarifador');
const { crearPrecioEstandar } = require('../modules/canchas/strategies/standarPricing');
const { crearDescuentoSocio } = require('../modules/canchas/strategies/memberDiscountPricing');
const { crearRecargoHorarioPico } = require('../modules/canchas/strategies/peakHourPricing');
// Repository: Reserva de cancha y Membresía
const { crearReservasRepositorySequelize } = require('../modules/canchas/repositorio/reservas.sequelize');
const { crearMembresiasRepositorySequelize } = require('../modules/membresias/repositorio/membresias.sequelize');
// Observer (RF-08): aviso a la lista de espera
const { crearBusEventos, Eventos } = require('../common/bus-eventos');
const { crearAvisoListaEspera } = require('../modules/clases/observer/waitlistNotifier');
// CQRS nivel 2: tablero del gerente
const { crearOcupacionQuery } = require('../modules/reportes/ocupacion.query');
const { crearReportesRouter } = require('../modules/reportes/reportes.routes');

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
    // A. PATRONES (Unidad III)
    // ------------------------------------------
    // Strategy (RF-11). El ORDEN de la lista es una decisión de negocio:
    // primero el descuento de socio y después el recargo de horario pico,
    // que se calcula sobre el precio ya descontado ($1000 → $850 → $1020).
    const tarifador = crearTarifador({
        precioBase: crearPrecioEstandar(),
        reglas: [
            crearDescuentoSocio(),
            crearRecargoHorarioPico(),
        ],
    });

    // Repository: solo para los dos agregados con reglas ricas.
    const reservasRepo = crearReservasRepositorySequelize({ ReservaCanchaModel: ReservaCancha });
    const membresiasRepo = crearMembresiasRepositorySequelize({ MembresiaModel: Membresia });

    // Observer (RF-08): quién escucha qué evento queda escrito acá, en un solo lugar.
    const eventos = crearBusEventos();
    eventos.suscribir(Eventos.CUPO_LIBERADO, crearAvisoListaEspera({ ListaEsperaModel: ListaEspera }));

    // CQRS nivel 2: la lectura del tablero no pasa por el repositorio.
    const ocupacionQuery = crearOcupacionQuery({ sequelize });

    // ------------------------------------------
    // B. INYECCIÓN EN SERVICIOS (Lógica)
    // ------------------------------------------
    // Nivel 1: Sin dependencias de otros servicios
    const sedesService = crearSedesService({ SedeModel: Sede }); 
    const usuariosService = crearUsuariosService({ UsuarioModel: Usuario, MembresiaModel: Membresia, sequelize });

    // Nivel 2: Dependen de Nivel 1
    const membresiasService = crearMembresiasService({ membresiasRepo });
    
const accesoService = crearAccesoService({ 
    usuariosService, 
    sedesService, 
    RegistroAccesoModel: RegistroAcceso 
});

    const canchasService = crearCanchasService({
        CanchaModel: Cancha,
        reservasRepo,
        tarifador,
        usuariosService,
        sedesService
    });

    const clasesService = crearClasesService({
        ClaseModel: Clase,
        ReservaClaseModel: ReservaClase,
        ListaEsperaModel: ListaEspera,
        usuariosService,
        sedesService,
        sequelize,
        eventos
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
    const reportesRouter = crearReportesRouter({ ocupacionQuery });

    // Retornamos todas las rutas listas para ser montadas en Express
    return {
        usuariosRouter,
        membresiasRouter,
        sedesRouter,
        accesoRouter,
        canchasRouter,
        clasesRouter,
        pagosRouter,
        reportesRouter
    };
};

module.exports = setupCompositionRoot;