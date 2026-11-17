-- ============================================================
-- FitZone Sports - Esquema de Base de Datos (PostgreSQL / Supabase)
-- Script del equipo. Incluye "deleted_at" en usuarios (el modelo usa
-- borrado lógico, paranoid: true) y el trigger de cupos de clases.
-- Supabase: pegar completo en el SQL Editor y ejecutar.
-- Docker: el docker-compose lo ejecuta solo al crear la base (01-esquema.sql).
-- ============================================================

-- Supabase ya trae pgcrypto habilitado, pero por las dudas:
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- 1) usuarios
-- ------------------------------------------------------------
CREATE TABLE usuarios (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dni               VARCHAR(15) NOT NULL UNIQUE,
  nombre_completo   VARCHAR(120) NOT NULL,
  email             VARCHAR(160) NOT NULL UNIQUE,
  telefono          VARCHAR(30),
  foto_url          VARCHAR(255),
  tipo              VARCHAR(20) NOT NULL CHECK (tipo IN ('SOCIO', 'CLIENTE_EXTERNO')),
  rol               VARCHAR(20) NOT NULL DEFAULT 'CLIENTE'
                      CHECK (rol IN ('CLIENTE', 'RECEPCIONISTA', 'ADMIN_SEDE', 'GERENTE')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 2) sedes
-- ------------------------------------------------------------
CREATE TABLE sedes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         VARCHAR(80) NOT NULL UNIQUE,
  direccion      VARCHAR(160),
  aforo_maximo   INTEGER NOT NULL DEFAULT 100,
  activa         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3) membresias (1 a 1 con usuarios: un socio tiene una membresía)
-- ------------------------------------------------------------
CREATE TABLE membresias (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id              UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  plan                    VARCHAR(20) NOT NULL CHECK (plan IN ('MENSUAL', 'TRIMESTRAL', 'ANUAL')),
  estado                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
                            CHECK (estado IN ('ACTIVO', 'VENCIDO', 'SUSPENDIDO')),
  fecha_inicio            DATE NOT NULL,
  fecha_vencimiento       DATE NOT NULL,
  renovacion_automatica   BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 4) registros_acceso (control de ingreso/egreso por sede)
-- ------------------------------------------------------------
CREATE TABLE registros_acceso (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  sede_id         UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  fecha_ingreso   TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_egreso    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 5) canchas
-- ------------------------------------------------------------
CREATE TABLE canchas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sede_id       UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  nombre        VARCHAR(60) NOT NULL,
  tipo          VARCHAR(30) NOT NULL CHECK (tipo IN ('FUTBOL', 'PADEL')),
  precio_hora   DECIMAL(10,2) NOT NULL,
  estado        VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE'
                  CHECK (estado IN ('DISPONIBLE', 'MANTENIMIENTO', 'INACTIVA')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 6) reservas_cancha
--    RN-02: no puede haber 2 reservas activas para la misma cancha
--    en el mismo horario -> índice único parcial (a nivel de base
--    de datos, no aplicación, para que la concurrencia real quede
--    resuelta por Postgres).
-- ------------------------------------------------------------
CREATE TABLE reservas_cancha (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancha_id             UUID NOT NULL REFERENCES canchas(id) ON DELETE CASCADE,
  usuario_id            UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_hora_inicio     TIMESTAMPTZ NOT NULL,
  fecha_hora_fin        TIMESTAMPTZ NOT NULL,
  precio_final          DECIMAL(10,2) NOT NULL,
  detalle_precio        JSONB,
  estado                VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE_PAGO'
                          CHECK (estado IN ('PENDIENTE_PAGO', 'CONFIRMADA', 'CANCELADA')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice único PARCIAL: solo aplica mientras la reserva está
-- pendiente de pago o confirmada. Una vez CANCELADA, libera el turno.
CREATE UNIQUE INDEX uq_reserva_cancha_turno_activo
  ON reservas_cancha (cancha_id, fecha_hora_inicio)
  WHERE estado IN ('PENDIENTE_PAGO', 'CONFIRMADA');

-- ------------------------------------------------------------
-- 7) clases
-- ------------------------------------------------------------
CREATE TABLE clases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sede_id             UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  tipo                VARCHAR(60) NOT NULL,
  instructor          VARCHAR(80) NOT NULL,
  fecha_hora          TIMESTAMPTZ NOT NULL,
  capacidad_maxima    INTEGER NOT NULL,
  cupos_disponibles   INTEGER NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 8) reservas_clase
-- ------------------------------------------------------------
CREATE TABLE reservas_clase (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clase_id        UUID NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
  usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estado          VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADA'
                    CHECK (estado IN ('CONFIRMADA', 'CANCELADA', 'ASISTIO')),
  con_penalidad   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (clase_id, usuario_id)
);

-- ------------------------------------------------------------
-- 9) lista_espera (Observer: se notifica cuando se libera un cupo)
-- ------------------------------------------------------------
CREATE TABLE lista_espera (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clase_id     UUID NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
  usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  notificado   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (clase_id, usuario_id)
);

-- ------------------------------------------------------------
-- 10) pagos
-- ------------------------------------------------------------
-- pagos (Maneja cobros tanto de reservas de canchas como de cuotas de membresías - RF-02 y RF-13)
CREATE TABLE pagos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Ambas claves foráneas son opcionales individualmente...
    reserva_cancha_id   UUID REFERENCES reservas_cancha(id) ON DELETE RESTRICT,
    membresia_id        UUID REFERENCES membresias(id) ON DELETE RESTRICT,

    monto               DECIMAL(10,2) NOT NULL,
    estado              VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    token_pasarela      VARCHAR(80),
    ultimos4            VARCHAR(4),
    motivo_rechazo      VARCHAR(120),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Esta regla fuerza a que exactamente UNA de las dos contenga un dato
  CONSTRAINT chk_pago_concepto CHECK (
    (reserva_cancha_id IS NOT NULL AND membresia_id IS NULL)
    OR
    (reserva_cancha_id IS NULL AND membresia_id IS NOT NULL)
  )
);

-- ------------------------------------------------------------
-- 11) notificaciones
-- ------------------------------------------------------------
CREATE TABLE notificaciones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo         VARCHAR(40) NOT NULL,
  mensaje      VARCHAR(255) NOT NULL,
  leida        BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);


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

CREATE TRIGGER trg_actualizar_cupos_clase
  AFTER INSERT OR UPDATE OR DELETE ON reservas_clase
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_cupos_clase();
-- ------------------------------------------------------------
-- Índices adicionales que usan las queries más frecuentes
-- ------------------------------------------------------------
CREATE INDEX idx_registros_acceso_sede_fecha ON registros_acceso (sede_id, fecha_ingreso);
CREATE INDEX idx_reservas_cancha_usuario ON reservas_cancha (usuario_id);
CREATE INDEX idx_reservas_clase_usuario ON reservas_clase (usuario_id);
CREATE INDEX idx_clases_sede_fecha ON clases (sede_id, fecha_hora);
