const db = require('../config/database');

class PrintJobService {
  static async enqueue({ clienteId = null, sedeId, impresoraId = null, tipo, payload, maxIntentos = 5 }) {
    const [row] = await db('print_jobs')
      .insert({
        cliente_id: clienteId,
        sede_id: sedeId,
        impresora_id: impresoraId,
        tipo,
        payload,
        estado: 'pendiente',
        intentos: 0,
        max_intentos: maxIntentos,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id', 'estado', 'tipo', 'sede_id', 'impresora_id', 'created_at']);

    return row;
  }

  static async claimNext({ sedeId, agenteId = 'bridge-agent' }) {
    const query = `
      WITH next_job AS (
        SELECT id
        FROM print_jobs
        WHERE estado = 'pendiente'
          AND sede_id = ?
          AND intentos < max_intentos
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE print_jobs pj
      SET estado = 'procesando',
          agente_id = ?,
          locked_at = NOW(),
          updated_at = NOW()
      FROM next_job
      WHERE pj.id = next_job.id
      RETURNING pj.*
    `;

    const result = await db.raw(query, [sedeId, agenteId]);
    const rows = result.rows || [];
    return rows[0] || null;
  }

  static async markDone({ jobId }) {
    const [row] = await db('print_jobs')
      .where('id', jobId)
      .update({
        estado: 'completado',
        procesado_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id', 'estado', 'procesado_at']);

    return row || null;
  }

  static async markFailed({ jobId, errorMessage }) {
    const [current] = await db('print_jobs')
      .where('id', jobId)
      .select('id', 'intentos', 'max_intentos')
      .limit(1);

    if (!current) return null;

    const intentos = Number(current.intentos || 0) + 1;
    const agotado = intentos >= Number(current.max_intentos || 5);

    const [row] = await db('print_jobs')
      .where('id', jobId)
      .update({
        estado: agotado ? 'fallido' : 'pendiente',
        intentos,
        locked_at: null,
        ultimo_error: errorMessage ? String(errorMessage).slice(0, 4000) : null,
        updated_at: new Date(),
      })
      .returning(['id', 'estado', 'intentos', 'max_intentos', 'ultimo_error']);

    return row || null;
  }
}

module.exports = PrintJobService;
