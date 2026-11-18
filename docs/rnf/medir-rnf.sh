#!/usr/bin/env bash
# Reproduce la evidencia de RNF-02, RNF-03 y RNF-04 contra el sistema levantado con
#   docker compose up --build
# Uso (desde la raíz del repositorio, en Linux, macOS o Git Bash):
#   bash docs/rnf/medir-rnf.sh
# Necesita curl y jq. Deja la base como estaba: borra lo que crea.
set -euo pipefail
API=${API:-http://localhost:3000/api/v1}
PSQL=${PSQL:-docker compose exec -T db psql -U fitzone -d fitzone}
PGDUMP=${PGDUMP:-docker compose exec -T db pg_dump -U fitzone -d fitzone --data-only}
LUCIA=$($PSQL -Atc "select id from usuarios where dni='30111222'")
CANCHA=$($PSQL -Atc "select id from canchas where estado='DISPONIBLE' order by nombre, id limit 1")
DIA=$(TZ=America/Argentina/Buenos_Aires date -d '+3 days' +%Y-%m-%d 2>/dev/null || date -v+3d +%Y-%m-%d)

echo "=== RNF-02 · datos de tarjeta ==="
RID=$(curl -s -X POST "$API/canchas/reservas" -H 'Content-Type: application/json' \
  -d "{\"canchaId\":\"$CANCHA\",\"usuarioId\":\"$LUCIA\",\"fechaHoraInicio\":\"${DIA}T10:00:00-03:00\"}" | jq -r .id)
curl -s -X POST "$API/pagos" -H 'Content-Type: application/json' \
  -d "{\"reservaId\":\"$RID\",\"usuarioId\":\"$LUCIA\",\"tarjeta\":{\"numero\":\"4111111111111234\",\"titular\":\"LUCIA FERNANDEZ\",\"vencimiento\":\"12/29\",\"cvv\":\"123\"}}" \
  | jq '{estado, monto, tokenPasarela, ultimos4}'
$PSQL -c "select estado, monto, token_pasarela, ultimos4 from pagos where reserva_cancha_id='$RID'"
echo "Apariciones del número completo o del titular en toda la base: $($PGDUMP | grep -c -E '4111111111111234|LUCIA FERNANDEZ' || true)"
$PSQL -q -c "delete from pagos where reserva_cancha_id='$RID'; delete from reservas_cancha where id='$RID'"

echo "=== RNF-03 · disponibilidad con un año de reservas ==="
$PSQL -q -c "insert into reservas_cancha (cancha_id, usuario_id, fecha_hora_inicio, fecha_hora_fin, precio_final, detalle_precio, estado)
select c.id, '$LUCIA', t, t + interval '1 hour', 1000, '[]', 'CONFIRMADA'
from canchas c, generate_series(date_trunc('day', now()) - interval '365 days' + interval '11 hours', date_trunc('day', now()) - interval '1 day', interval '1 hour') t
where extract(hour from t at time zone 'America/Argentina/Buenos_Aires') between 8 and 22; analyze reservas_cancha;"
echo "Filas en reservas_cancha: $($PSQL -Atc 'select count(*) from reservas_cancha')"
$PSQL -c "explain analyze select fecha_hora_inicio from reservas_cancha where cancha_id='$CANCHA' and estado in ('PENDIENTE_PAGO','CONFIRMADA') and fecha_hora_inicio between '${DIA} 08:00-03' and '${DIA} 23:00-03'"
for i in $(seq 100); do curl -s -o /dev/null -w "%{time_total}\n" "$API/canchas/$CANCHA/disponibilidad?fecha=$DIA"; done \
  | awk '{print $1*1000}' | sort -n \
  | awk '{t[NR]=$1; s+=$1} END{printf "GET disponibilidad, 100 pedidos (ms): promedio %.1f · mediana %.1f · p95 %.1f · máximo %.1f\n", s/NR, t[int(NR/2)], t[int(NR*0.95)], t[NR]}'
$PSQL -q -c "delete from reservas_cancha where fecha_hora_inicio < date_trunc('day', now()) and usuario_id='$LUCIA' and precio_final=1000; analyze reservas_cancha;"

echo "=== RNF-04 · sede nueva sin detener el sistema ==="
echo "Sedes antes: $(curl -s "$API/sedes" | jq length)"
NID=$(curl -s -X POST "$API/sedes" -H 'Content-Type: application/json' -d '{"nombre":"FitZone Prueba RNF-04","direccion":"Av. Siempre Viva 742","aforoMaximo":80}' | jq -r .id)
curl -s -X POST "$API/canchas" -H 'Content-Type: application/json' -d "{\"sedeId\":\"$NID\",\"nombre\":\"Pádel 1\",\"tipo\":\"PADEL\",\"precioHora\":12000}" | jq -c '{nombre, tipo, estado}'
echo "Sedes después: $(curl -s "$API/sedes" | jq length) · aforo de la nueva: $(curl -s "$API/acceso/aforo/$NID" | jq -c '{actual, maximo}')"
$PSQL -q -c "delete from canchas where sede_id='$NID'; delete from sedes where id='$NID'"
