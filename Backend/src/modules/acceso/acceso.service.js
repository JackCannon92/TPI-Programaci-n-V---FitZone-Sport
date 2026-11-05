'use strict';

const QRCode = require('qrcode');
const { generarToken, validarToken } = require('./qr-token');
const { emitirQrOffline, validarQrOffline: validarFirmaOffline, clavePublicaPem } = require('./qr-offline');
const { verificarQr, qrSvg, TiposQr, MotivosQr } = require('../../common/qr-firmado');
const { EstadoReservaCancha } = require('../../common/enums');

// Función auxiliar para adjuntar el Status HTTP correcto a los errores
const lanzarError = (mensaje, statusCode) => {
  const error = new Error(mensaje);
  error.status = statusCode;
  throw error;
};

const MENSAJES_QR_RESERVA = {
  [MotivosQr.INVALIDO]: 'QR de reserva inválido.',
  [MotivosQr.TODAVIA_NO_VALE]: 'El QR de la reserva todavía no vale: se puede entrar desde 30 minutos antes del turno.',
  [MotivosQr.VENCIDO]: 'El QR de la reserva ya venció: el turno terminó.',
};

// INYECCIÓN: recibe el RegistroAccesoModel y, para el QR de reserva, el servicio de canchas.
function crearAccesoService({ usuariosService, sedesService, canchasService, RegistroAccesoModel }) {

  // RF-04 · QR dinámico del socio (cambia cada minuto)
  async function generarQr(usuarioId) {
    const usuario = await usuariosService.obtenerUsuario(usuarioId);
    const { token, expiraEnSegundos } = generarToken(usuario.id);
    const svg = await QRCode.toString(token, { type: 'svg', margin: 1, width: 240 });
    return { usuarioId: usuario.id, token, expiraEnSegundos, svg };
  }

  async function registroAbierto(usuarioId) {
    return RegistroAccesoModel.findOne({ where: { usuarioId, fechaEgreso: null } });
  }

  async function aforo(sedeId) {
    const sede = await sedesService.obtenerSede(sedeId);
    const actual = await RegistroAccesoModel.count({ where: { sedeId, fechaEgreso: null } });
    return { sedeId: sede.id, sede: sede.nombre, actual, maximo: sede.aforoMaximo, disponible: sede.aforoMaximo - actual };
  }

  /** Reglas comunes a cualquier ingreso, entre con el QR que entre: RN-01 y aforo (RF-05). */
  async function ingresar(usuario, sedeId) {
    const abierto = await registroAbierto(usuario.id);
    // Código 409: Conflicto (RN-01 Multi-sede: ya está adentro de un gimnasio)
    if (abierto) {
      const donde = abierto.sedeId === sedeId ? 'esta sede' : 'otra sede';
      lanzarError(`RN-01: el usuario ya figura adentro de ${donde}. Registrar el egreso primero.`, 409);
    }

    const { actual, maximo } = await aforo(sedeId);
    // Código 409: Conflicto (El gimnasio está lleno)
    if (actual >= maximo) lanzarError('Aforo completo en esta sede.', 409);

    const registro = await RegistroAccesoModel.create({ usuarioId: usuario.id, sedeId });
    return { registro, usuario: { id: usuario.id, nombreCompleto: usuario.nombre_completo, tipo: usuario.tipo } };
  }

  // RF-04 · Ingreso con el QR dinámico del socio
  async function registrarIngreso({ token, sedeId }) {
    const usuarioId = validarToken(token);
    // Código 401: No autorizado (QR vencido o adulterado)
    if (!usuarioId) lanzarError('QR invalido o vencido. Pedile al socio que lo refresque.', 401);

    const usuario = await usuariosService.obtenerUsuario(usuarioId);
    // Código 403: Prohibido (Tiene deudas o membresía vencida)
    if (usuario.tipo === 'SOCIO' && !usuariosService.esSocioActivo(usuario)) {
      lanzarError('Membresia vencida o suspendida: no puede ingresar.', 403);
    }
    return ingresar(usuario, sedeId);
  }

  // QR 1 · Ingreso con el QR de una reserva de cancha (clientes externos y socios)
  async function registrarIngresoConReserva({ token, sedeId }) {
    const resultado = verificarQr(token, TiposQr.RESERVA_CANCHA);
    if (!resultado.ok) lanzarError(MENSAJES_QR_RESERVA[resultado.motivo], 401);
    const { reservaId, usuarioId, sedeId: sedeDeLaReserva } = resultado.datos;

    if (sedeDeLaReserva !== sedeId) lanzarError('Esta reserva es para otra sede.', 403);

    // El QR puede ser auténtico y la reserva haberse cancelado después: se consulta su estado actual.
    const reserva = await canchasService.obtenerReserva(reservaId);
    if (reserva.estado !== EstadoReservaCancha.CONFIRMADA) {
      lanzarError('La reserva ya no está confirmada (fue cancelada).', 409);
    }

    // No se pide membresía: el que alquila una cancha puede ser un cliente externo.
    const usuario = await usuariosService.obtenerUsuario(usuarioId);
    const ingreso = await ingresar(usuario, sedeId);
    return { ...ingreso, reservaId };
  }

  // QR 2 · QR de acceso sin conexión (solo para socios con la membresía activa)
  async function generarQrOffline(usuarioId) {
    const usuario = await usuariosService.obtenerUsuario(usuarioId);
    if (!usuariosService.esSocioActivo(usuario)) {
      lanzarError('Solo un socio con la membresía activa puede tener el QR sin conexión.', 403);
    }
    const { token, validoHasta } = emitirQrOffline({
      usuarioId: usuario.id,
      nombre: usuario.nombre_completo,
      venceMembresia: usuario.membresia.fecha_vencimiento,
    });
    return { usuarioId: usuario.id, token, validoHasta, svg: await qrSvg(token) };
  }

  /**
   * QR 2 · Lo mismo que hace el torno cuando no hay internet: valida la firma y
   * la vigencia con la clave pública, SIN consultar la base de datos.
   */
  function validarQrOffline(token) {
    return validarFirmaOffline(token);
  }

  function clavePublicaOffline() {
    return { algoritmo: 'Ed25519', clavePublica: clavePublicaPem() };
  }

  async function registrarEgreso({ usuarioId, sedeId }) {
    const abierto = await RegistroAccesoModel.findOne({ where: { usuarioId, sedeId, fechaEgreso: null } });
    // Código 404: No encontrado (El usuario no estaba adentro)
    if (!abierto) lanzarError('El usuario no figura adentro de esta sede.', 404);

    abierto.fechaEgreso = new Date();
    await abierto.save();
    return abierto;
  }

  async function presentes(sedeId) {
    const registros = await RegistroAccesoModel.findAll({ where: { sedeId, fechaEgreso: null }, order: [['fechaIngreso', 'ASC']] });
    const usuarios = await usuariosService.obtenerVarios(registros.map((r) => r.usuarioId));
    const porId = new Map(usuarios.map((u) => [u.id, u]));

    return registros.map((r) => {
      const u = porId.get(r.usuarioId);
      return { registroId: r.id, usuarioId: r.usuarioId, nombreCompleto: u ? u.nombre_completo : '?', tipo: u ? u.tipo : '?', fechaIngreso: r.fechaIngreso };
    });
  }

  return {
    generarQr, aforo, registrarIngreso, registrarIngresoConReserva,
    generarQrOffline, validarQrOffline, clavePublicaOffline,
    registrarEgreso, presentes,
  };
}

module.exports = { crearAccesoService };
