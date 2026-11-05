'use strict';

/**
 * Datos y dobles de prueba compartidos por los tests unitarios y de integración.
 *
 * Arman los servicios REALES (canchas, membresías) con el repositorio EN MEMORIA
 * y el Tarifador real: así se prueba el dominio entero sin base de datos.
 */
const { crearCanchasService } = require('../../src/modules/canchas/canchas.service');
const { crearReservasRepositoryMemoria } = require('../../src/modules/canchas/repositorio/reservas.memoria');
const { crearMembresiasService } = require('../../src/modules/membresias/membresias.service');
const { crearMembresiasRepositoryMemoria } = require('../../src/modules/membresias/repositorio/membresias.memoria');
const { crearTarifador } = require('../../src/modules/canchas/strategies/tarifador');
const { crearPrecioEstandar } = require('../../src/modules/canchas/strategies/standarPricing');
const { crearDescuentoSocio } = require('../../src/modules/canchas/strategies/memberDiscountPricing');
const { crearRecargoHorarioPico } = require('../../src/modules/canchas/strategies/peakHourPricing');
const { crearAccesoService } = require('../../src/modules/acceso/acceso.service');
const { randomUUID } = require('node:crypto');

// UUIDs fijos: los validadores de las rutas exigen formato UUID.
const CANCHA = {
  id: '11111111-1111-4111-8111-111111111111',
  sedeId: '22222222-2222-4222-8222-222222222222',
  nombre: 'Padel 1',
  precioHora: '1000.00', // Sequelize devuelve los DECIMAL como string
  estado: 'DISPONIBLE',
};
const SOCIO = {
  id: '33333333-3333-4333-8333-333333333333', tipo: 'SOCIO', nombre_completo: 'Socio Prueba', dni: '30111222',
  membresia: { estado: 'ACTIVO', fecha_vencimiento: '2030-12-31' },
};
const EXTERNO = { id: '44444444-4444-4444-8444-444444444444', tipo: 'CLIENTE_EXTERNO', nombre_completo: 'Externo Prueba', dni: '30999888', membresia: null };
const SEDE = { id: CANCHA.sedeId, nombre: 'Sede Centro', aforoMaximo: 50 };
const TURNO_PICO = new Date(2030, 4, 15, 19, 0); // 15/05/2030 19:00, hora local

/** La misma cadena de estrategias que arma core/compositionRoot.js */
const tarifadorFitZone = () => crearTarifador({
  precioBase: crearPrecioEstandar(),
  reglas: [crearDescuentoSocio(), crearRecargoHorarioPico()],
});

const usuariosServiceFalso = {
  obtenerUsuario: async (id) => {
    const usuario = [SOCIO, EXTERNO].find((u) => u.id === id);
    if (!usuario) throw new Error(`Usuario ${id} no encontrado`);
    return usuario;
  },
  esSocioActivo: (u) => u.tipo === 'SOCIO' && u.membresia?.estado === 'ACTIVO',
};

function canchaModelFalso(cancha = CANCHA) {
  return { findByPk: async (id) => (id === cancha.id ? { ...cancha } : null) };
}

/** Servicio de canchas real + repositorio en memoria + tarifador real. */
function crearCanchasDePrueba({ cancha = CANCHA } = {}) {
  const reservasRepo = crearReservasRepositoryMemoria();
  const servicio = crearCanchasService({
    CanchaModel: canchaModelFalso(cancha),
    reservasRepo,
    tarifador: tarifadorFitZone(),
    usuariosService: usuariosServiceFalso,
    sedesService: { obtenerSede: async () => ({}) },
  });
  return { servicio, reservasRepo };
}

/** Servicio de membresías real + repositorio en memoria. */
function crearMembresiasDePrueba() {
  const membresiasRepo = crearMembresiasRepositoryMemoria();
  return { servicio: crearMembresiasService({ membresiasRepo }), membresiasRepo };
}

/** Doble de RegistroAccesoModel: guarda los ingresos en memoria. */
function registroAccesoFalso() {
  const filas = [];
  const coincide = (f, where) => Object.entries(where).every(([k, v]) => f[k] === v);
  return {
    filas,
    findOne: async ({ where }) => filas.find((f) => coincide(f, where)) ?? null,
    count: async ({ where }) => filas.filter((f) => coincide(f, where)).length,
    create: async (datos) => {
      const fila = { id: `registro-${filas.length + 1}`, fechaIngreso: new Date(), fechaEgreso: null, ...datos, save: async () => {} };
      filas.push(fila);
      return fila;
    },
  };
}

/** Servicio de acceso real con un registro de accesos en memoria. */
function crearAccesoDePrueba({ canchasService, sede = SEDE } = {}) {
  const RegistroAccesoModel = registroAccesoFalso();
  const servicio = crearAccesoService({
    usuariosService: { ...usuariosServiceFalso, obtenerVarios: async () => [SOCIO, EXTERNO] },
    sedesService: { obtenerSede: async (id) => ({ ...sede, id }) },
    canchasService,
    RegistroAccesoModel,
  });
  return { servicio, RegistroAccesoModel };
}

/** Doble de PagoModel: guarda los pagos en memoria. */
function pagoModelFalso() {
  const filas = new Map();
  return {
    filas,
    create: async (datos) => {
      const fila = { id: randomUUID(), created_at: new Date(), ...datos };
      filas.set(fila.id, fila);
      return fila;
    },
    findByPk: async (id) => filas.get(id) ?? null,
  };
}

const loggerMudo = { log: () => {}, error: () => {} };
const haceDias = (dias) => new Date(Date.now() - dias * 864e5);

module.exports = {
  CANCHA, SOCIO, EXTERNO, SEDE, TURNO_PICO,
  tarifadorFitZone, usuariosServiceFalso, canchaModelFalso,
  crearCanchasDePrueba, crearMembresiasDePrueba, crearAccesoDePrueba, registroAccesoFalso, pagoModelFalso,
  loggerMudo, haceDias,
};
