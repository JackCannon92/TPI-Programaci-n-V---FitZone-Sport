'use strict';

const QRCode = require('qrcode');
const { generarToken, validarToken } = require('./qr-token');

// Función auxiliar para adjuntar el Status HTTP correcto a los errores
const lanzarError = (mensaje, statusCode) => {
  const error = new Error(mensaje);
  error.status = statusCode;
  throw error;
};

// INYECCIÓN: Recibe el RegistroAccesoModel como parámetro
function crearAccesoService({ usuariosService, sedesService, RegistroAccesoModel }) {
  
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

  async function registrarIngreso({ token, sedeId }) {
    const usuarioId = validarToken(token);
    // Código 401: No autorizado (QR vencido o adulterado)
    if (!usuarioId) lanzarError('QR invalido o vencido. Pedile al socio que lo refresque.', 401);

    const usuario = await usuariosService.obtenerUsuario(usuarioId);
    const esSocio = usuario.tipo === 'SOCIO';
    // Código 403: Prohibido (Tiene deudas o membresía vencida)
    if (esSocio && !usuariosService.esSocioActivo(usuario)) {
      lanzarError('Membresia vencida o suspendida: no puede ingresar.', 403);
    }

    const abierto = await registroAbierto(usuarioId);
    // Código 409: Conflicto (RN-01 Multi-sede: ya está adentro de un gimnasio)
    if (abierto) {
      const donde = abierto.sedeId === sedeId ? 'esta sede' : 'otra sede';
      lanzarError(`RN-01: el usuario ya figura adentro de ${donde}. Registrar el egreso primero.`, 409);
    }

    const { actual, maximo } = await aforo(sedeId);
    // Código 409: Conflicto (El gimnasio está lleno)
    if (actual >= maximo) lanzarError('Aforo completo en esta sede.', 409);

    const registro = await RegistroAccesoModel.create({ usuarioId, sedeId });
    return { registro, usuario: { id: usuario.id, nombreCompleto: usuario.nombreCompleto, tipo: usuario.tipo } };
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
      return { registroId: r.id, usuarioId: r.usuarioId, nombreCompleto: u ? u.nombreCompleto : '?', tipo: u ? u.tipo : '?', fechaIngreso: r.fechaIngreso };
    });
  }

  return { generarQr, aforo, registrarIngreso, registrarEgreso, presentes };
}

module.exports = { crearAccesoService };