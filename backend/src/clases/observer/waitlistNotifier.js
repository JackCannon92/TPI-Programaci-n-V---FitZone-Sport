'use strict';

/**
 * RF-08 · OBSERVADOR del evento CupoLiberado.
 *
 * Cuando se libera un cupo en una clase, avisa al primero de la lista de
 * espera que todavía no fue avisado y lo marca como notificado.
 *
 * Quién publica el evento (clases.service, al cancelar) no sabe que este
 * oyente existe: la suscripción se hace en core/compositionRoot.js. Sumar
 * otro interesado (métricas, tablero de ocupación, mail) es otro oyente y otra
 * línea de suscripción; clases.service no se toca.
 *
 * Avisar NO es reservar: el socio avisado tiene que entrar y reservar, y si
 * otro llega antes, gana el otro. Así el cupo nunca queda tomado por alguien
 * que no confirmó.
 */
function crearAvisoListaEspera({ ListaEsperaModel, logger = console }) {
  return async function alLiberarseCupo({ claseId }) {
    const primero = await ListaEsperaModel.findOne({
      where: { claseId, notificado: false },
      order: [['created_at', 'ASC']],
    });
    if (!primero) return null;

    primero.notificado = true;
    await primero.save();

    // No hay canal de notificaciones real todavía (push/mail): queda en el log.
    logger.log(`📣 [RF-08] Se liberó un cupo en la clase ${claseId}: avisamos al usuario ${primero.usuarioId}.`);
    return primero;
  };
}

module.exports = { crearAvisoListaEspera };
