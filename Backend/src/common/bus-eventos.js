'use strict';

/**
 * Bus de eventos de dominio — patrón OBSERVER.
 *
 * El SUJETO es el EventEmitter que ya trae Node: no reimplementamos el patrón
 * a mano (la cátedra lo marca como error: "un Observer a mano habiendo eventos
 * en la plataforma"). Lo que agrega este archivo son tres decisiones que el
 * EventEmitter pelado no toma por nosotros:
 *
 *  1. Aislamiento de fallas: si un oyente falla, se registra el error y los
 *     demás oyentes siguen. La operación que publicó el evento no se cae.
 *  2. Después del cambio: los servicios publican DESPUÉS de guardar, así el
 *     hecho ya es firme cuando lo escuchan (equivalente a AFTER_COMMIT).
 *  3. Asincronía: los oyentes corren en una microtarea aparte; la respuesta
 *     HTTP no espera al aviso. publicar() devuelve una promesa solo para que
 *     los tests puedan esperarla.
 *
 * Los eventos se nombran en pasado (son hechos) y están listados, con sus
 * oyentes, en docs/ADR-007-patrones-unidad-iii.md.
 */
const { EventEmitter } = require('node:events');

const Eventos = Object.freeze({
  /** Se canceló una reserva de clase y quedó un cupo libre (RF-08). */
  CUPO_LIBERADO: 'CupoLiberado',
});

function crearBusEventos({ logger = console } = {}) {
  const emisor = new EventEmitter();

  /**
   * @param {string} evento
   * @param {(payload: object) => (void|Promise<void>)} oyente
   */
  function suscribir(evento, oyente) {
    emisor.on(evento, (payload, pendientes) => {
      const ejecucion = Promise.resolve()
        .then(() => oyente(payload))
        .catch((error) => {
          logger.error(`[eventos] Falló un oyente de ${evento}: ${error.message}`);
        });
      pendientes.push(ejecucion);
    });
  }

  /**
   * @param {string} evento
   * @param {object} datos
   * @returns {Promise<void>} se resuelve cuando terminaron todos los oyentes
   */
  function publicar(evento, datos) {
    const pendientes = [];
    const payload = Object.freeze({ ...datos, ocurridoEn: new Date() });
    emisor.emit(evento, payload, pendientes);
    return Promise.all(pendientes).then(() => undefined);
  }

  return { suscribir, publicar };
}

module.exports = { crearBusEventos, Eventos };
