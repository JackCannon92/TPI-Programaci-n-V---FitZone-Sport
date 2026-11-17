-- ============================================================
-- FitZone Sports - Datos de prueba (seed)
-- 25 sedes, 2 o 3 canchas por sede, 3 clases por sede, un usuario
-- por cada uno de los cuatro roles y socios para probar los casos
-- de la demo (socio al día, socio en mora, cliente externo).
--
-- Docker: el docker-compose lo ejecuta solo, después del esquema.
-- Supabase: correrlo una vez en el SQL Editor, después del esquema.
-- Las fechas son relativas a "hoy", así las clases y las membresías
-- siempre quedan vigentes cuando se levanta el sistema.
-- ============================================================

BEGIN;

-- Las fechas se calculan en hora argentina (si no, una clase de las 9 quedaría a las 6).
SET LOCAL TIME ZONE 'America/Argentina/Buenos_Aires';

-- ------------------------------------------------------------
-- 1) Sedes (25)
-- ------------------------------------------------------------
INSERT INTO sedes (nombre, direccion, aforo_maximo) VALUES
  ('FitZone Concordia Centro',      'Pellegrini 850, Concordia',            120),
  ('FitZone Concordia Norte',       'Av. Frondizi 3200, Concordia',          80),
  ('FitZone Paraná Centro',         'San Martín 1100, Paraná',              150),
  ('FitZone Paraná Costanera',      'Av. Laurencena 400, Paraná',           100),
  ('FitZone Gualeguaychú',          '25 de Mayo 700, Gualeguaychú',         100),
  ('FitZone Concepción del Uruguay','Rocamora 900, Concepción del Uruguay',  90),
  ('FitZone Chajarí',               'Av. 9 de Julio 2100, Chajarí',          60),
  ('FitZone Federación',            'Av. San Martín 350, Federación',        60),
  ('FitZone Colón',                 '12 de Abril 300, Colón',                70),
  ('FitZone Victoria',              'Congreso 650, Victoria',                60),
  ('FitZone Villaguay',             'San Martín 250, Villaguay',             60),
  ('FitZone La Paz',                'Echagüe 500, La Paz',                   50),
  ('FitZone Santa Fe Centro',       'San Jerónimo 2400, Santa Fe',          150),
  ('FitZone Santa Fe Recoleta',     'Bv. Gálvez 1600, Santa Fe',            110),
  ('FitZone Rosario Centro',        'Córdoba 1500, Rosario',                150),
  ('FitZone Rosario Fisherton',     'Eva Perón 8200, Rosario',              120),
  ('FitZone Rafaela',               'Bv. Santa Fe 300, Rafaela',             80),
  ('FitZone Reconquista',           'Rivadavia 800, Reconquista',            70),
  ('FitZone Corrientes',            'Junín 1200, Corrientes',               110),
  ('FitZone Goya',                  'Colón 600, Goya',                       60),
  ('FitZone Posadas',               'Bolívar 1800, Posadas',                100),
  ('FitZone Córdoba Nueva Córdoba', 'Av. Hipólito Yrigoyen 300, Córdoba',   150),
  ('FitZone Córdoba Cerro',         'Av. Rafael Núñez 4500, Córdoba',       120),
  ('FitZone Buenos Aires Palermo',  'Av. Santa Fe 3800, CABA',              150),
  ('FitZone Buenos Aires Caballito','Av. Rivadavia 5200, CABA',             130);

-- ------------------------------------------------------------
-- 2) Canchas: pádel y fútbol en todas las sedes; una segunda de
--    pádel en las sedes con aforo de 100 o más.
-- ------------------------------------------------------------
INSERT INTO canchas (sede_id, nombre, tipo, precio_hora)
SELECT id, 'Pádel 1', 'PADEL', 8000 FROM sedes;

INSERT INTO canchas (sede_id, nombre, tipo, precio_hora)
SELECT id, 'Fútbol 5', 'FUTBOL', 15000 FROM sedes;

INSERT INTO canchas (sede_id, nombre, tipo, precio_hora)
SELECT id, 'Pádel 2', 'PADEL', 8000 FROM sedes WHERE aforo_maximo >= 100;

-- Una cancha en mantenimiento, para mostrar que no se puede reservar
UPDATE canchas SET estado = 'MANTENIMIENTO'
WHERE nombre = 'Pádel 2'
  AND sede_id = (SELECT id FROM sedes WHERE nombre = 'FitZone Paraná Centro');

-- ------------------------------------------------------------
-- 3) Clases: tres por sede, mañana (dentro de las 48 hs en que se
--    permite reservar).
-- ------------------------------------------------------------
INSERT INTO clases (sede_id, tipo, instructor, fecha_hora, capacidad_maxima, cupos_disponibles)
SELECT id, 'Funcional', 'Laura Méndez', (CURRENT_DATE + 1) + TIME '09:00', 20, 20 FROM sedes;

INSERT INTO clases (sede_id, tipo, instructor, fecha_hora, capacidad_maxima, cupos_disponibles)
SELECT id, 'Spinning', 'Pablo Ríos', (CURRENT_DATE + 1) + TIME '18:00', 15, 15 FROM sedes;

INSERT INTO clases (sede_id, tipo, instructor, fecha_hora, capacidad_maxima, cupos_disponibles)
SELECT id, 'Yoga', 'Ana Sosa', (CURRENT_DATE + 1) + TIME '19:30', 12, 12 FROM sedes;

-- Clase con 2 lugares en Concordia Centro, para probar la lista de espera
INSERT INTO clases (sede_id, tipo, instructor, fecha_hora, capacidad_maxima, cupos_disponibles)
SELECT id, 'Crossfit (cupo reducido)', 'Pablo Ríos', (CURRENT_DATE + 1) + TIME '20:00', 2, 2
FROM sedes WHERE nombre = 'FitZone Concordia Centro';

-- ------------------------------------------------------------
-- 4) Usuarios de prueba: uno por rol y los casos de la demo.
--    El sistema todavía no maneja contraseñas: se ingresa por DNI.
-- ------------------------------------------------------------
INSERT INTO usuarios (dni, nombre_completo, email, telefono, tipo, rol) VALUES
  -- Rol CLIENTE (socio)
  ('30111222', 'Lucía Fernández',  'lucia.fernandez@fitzone.test',  '3454111222', 'SOCIO',           'CLIENTE'),
  ('30222333', 'Diego Romero',     'diego.romero@fitzone.test',     '3454222333', 'SOCIO',           'CLIENTE'),
  ('35444555', 'Paula Gómez',      'paula.gomez@fitzone.test',      '3454444555', 'CLIENTE_EXTERNO', 'CLIENTE'),
  -- Personal de la cadena
  ('28555666', 'Carla Benítez',    'carla.benitez@fitzone.test',    '3454555666', 'CLIENTE_EXTERNO', 'RECEPCIONISTA'),
  ('27666777', 'Sergio Ledesma',   'sergio.ledesma@fitzone.test',   '3454666777', 'CLIENTE_EXTERNO', 'ADMIN_SEDE'),
  ('25777888', 'Graciela Ruiz',    'graciela.ruiz@fitzone.test',    '3454777888', 'CLIENTE_EXTERNO', 'GERENTE');

-- Lucía: socia al día (plan anual)
INSERT INTO membresias (usuario_id, plan, estado, fecha_inicio, fecha_vencimiento, renovacion_automatica)
SELECT id, 'ANUAL', 'ACTIVO', CURRENT_DATE - 30, CURRENT_DATE + 335, true
FROM usuarios WHERE dni = '30111222';

-- Diego: socio en mora (su membresía venció hace 10 días): paga canchas como externo
INSERT INTO membresias (usuario_id, plan, estado, fecha_inicio, fecha_vencimiento)
SELECT id, 'MENSUAL', 'VENCIDO', CURRENT_DATE - 40, CURRENT_DATE - 10
FROM usuarios WHERE dni = '30222333';

-- 20 socios más, para que las listas y el aforo tengan datos
INSERT INTO usuarios (dni, nombre_completo, email, tipo, rol)
SELECT (40000000 + n)::text, 'Socio de prueba ' || n, 'socio' || n || '@fitzone.test', 'SOCIO', 'CLIENTE'
FROM generate_series(1, 20) AS n;

INSERT INTO membresias (usuario_id, plan, estado, fecha_inicio, fecha_vencimiento)
SELECT id, 'MENSUAL', 'ACTIVO', CURRENT_DATE - 5, CURRENT_DATE + 25
FROM usuarios WHERE email LIKE 'socio%@fitzone.test';

COMMIT;
