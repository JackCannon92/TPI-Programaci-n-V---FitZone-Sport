-- ============================================================
-- FitZone Sports - Trigger de cupos de clases (solo esta parte)
-- Correr UNA vez en el SQL Editor de Supabase si la base se creó
-- con Sequelize y no tiene el trigger. Es seguro correrlo dos veces.
-- Sin esto, la clase nunca se llena (clases.service no descuenta
-- el cupo: lo delega en este trigger) y la lista de espera (RF-08)
-- no se puede usar.
-- ============================================================

-- ------------------------------------------------------------
-- Función y Trigger para reservas_clase
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_actualizar_cupos_clase()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Si alguien hace una reserva nueva
  IF TG_OP = 'INSERT' AND NEW.estado = 'CONFIRMADA' THEN
    UPDATE clases
      SET cupos_disponibles = cupos_disponibles - 1
      WHERE id = NEW.clase_id AND cupos_disponibles > 0;

    --  Si no encontró cupos, frena todo y lanza un error limpio
    IF NOT FOUND THEN
      RAISE EXCEPTION 'No hay cupos disponibles para la clase %', NEW.clase_id;
    END IF;
    RETURN NEW;

  -- 2. Si alguien modifica su reserva existente
  ELSIF TG_OP = 'UPDATE' THEN
    -- A. Cancela a tiempo (Libera el cupo explícitamente)
    IF OLD.estado = 'CONFIRMADA' AND NEW.estado = 'CANCELADA' THEN
      UPDATE clases SET cupos_disponibles = cupos_disponibles + 1 WHERE id = NEW.clase_id;

    -- B. Estaba cancelado y lo vuelve a confirmar (Resta cupo)
    ELSIF OLD.estado = 'CANCELADA' AND NEW.estado = 'CONFIRMADA' THEN
      UPDATE clases
        SET cupos_disponibles = cupos_disponibles - 1
        WHERE id = NEW.clase_id AND cupos_disponibles > 0;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'No hay cupos disponibles para la clase %', NEW.clase_id;
      END IF;
    END IF;
    -- Nota: Si pasa a 'ASISTIO', no hace nada matemático, el cupo ya se consumió.
    RETURN NEW;

  -- 3. Si un administrador borra la fila por error
  ELSIF TG_OP = 'DELETE' AND OLD.estado = 'CONFIRMADA' THEN
    UPDATE clases SET cupos_disponibles = cupos_disponibles + 1 WHERE id = OLD.clase_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_cupos_clase ON reservas_clase;
CREATE TRIGGER trg_actualizar_cupos_clase
  AFTER INSERT OR UPDATE OR DELETE ON reservas_clase
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_cupos_clase();
