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
const { crearUsuariosService } = require('../usuarios/usuarios.service');
const { crearMembresiasService } = require('../membresias/membresias.service');
const { crearSedesService } = require('../sedes/sede.service'); 
const { crearAccesoService } = require('../acceso/acceso.service');
const { crearCanchasService } = require('../canchas/canchas.service');
const { crearClasesService } = require('../clases/clases.service');
const { crearPagosService } = require('../pagos/pagos.service');
const { crearPasarelaMock } = require('../pagos/pasarela-mock');

// Unidad III · Patrones de diseño (un ADR por patrón: docs/adr/ADR-013, ADR-014 y ADR-015)
// Strategy (RF-11): precio de canchas
const { crearTarifador } = require('../canchas/strategies/tarifador');
const { crearPrecioEstandar } = require('../canchas/strategies/standarPricing');
const { crearDescuentoSocio } = require('../canchas/strategies/memberDiscountPricing');
const { crearRecargoHorarioPico } = require('../canchas/strategies/peakHourPricing');
// Repository: Reserva de cancha y Membresía
const { crearReservasRepositorySequelize } = require('../canchas/repositorio/reservas.sequelize');
const { crearMembresiasRepositorySequelize } = require('../membresias/repositorio/membresias.sequelize');
// Observer (RF-08): aviso a la lista de espera
const { crearBusEventos, Eventos } = require('../common/bus-eventos');
const { crearAvisoListaEspera } = require('../clases/observer/waitlistNotifier');

// ==========================================
// 3. IMPORTAR CAPA DE CONTROLADORES
// ==========================================
const { crearUsuariosController } = require('../usuarios/usuarios.controller');
const { crearMembresiasController } = require('../membresias/membresias.controller');
const { crearSedesController } = require('../sedes/sede.controller');
const { crearAccesoController } = require('../acceso/acceso.controller');
const { crearCanchasController } = require('../canchas/canchas.controller');
const { crearClasesController } = require('../clases/clases.controller');
const { crearPagosController } = require('../pagos/pagos.controller');


// ==========================================
// 4. IMPORTAR CAPA DE RUTAS
// ==========================================
const { crearUsuariosRouter } = require('../usuarios/usuarios.routes');
const { crearMembresiasRouter } = require('../membresias/membresias.routes');
const { crearSedesRouter } = require('../sedes/sede.routes');
const { crearAccesoRouter } = require('../acceso/acceso.routes');
const { crearCanchasRouter } = require('../canchas/canchas.routes');
const { crearClasesRouter } = require('../clases/clases.routes');
const { crearPagosRouter } = require('../pagos/pagos.routes');

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


    // ------------------------------------------
    // B. INYECCIÓN EN SERVICIOS (Lógica)
    // ------------------------------------------
    // Nivel 1: Sin dependencias de otros servicios
    const sedesService = crearSedesService({ SedeModel: Sede }); 
    const usuariosService = crearUsuariosService({ UsuarioModel: Usuario, MembresiaModel: Membresia, sequelize });

    // Nivel 2: Dependen de Nivel 1
    const membresiasService = crearMembresiasService({ membresiasRepo });
    

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
    
    // Acceso usa el servicio de canchas para el QR de reserva (ADR-016)
    const accesoService = crearAccesoService({
        usuariosService,
        sedesService,
        canchasService,
        RegistroAccesoModel: RegistroAcceso
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