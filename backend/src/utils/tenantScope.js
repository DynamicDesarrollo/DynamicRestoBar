const db = require('../config/database');

/**
 * Ids de sede que pertenecen al cliente (empresa) dado.
 * Toda lectura/escritura de recursos scoped por sede (mesas, productos,
 * insumos, recetas, impresoras, zonas, informes, etc.) debe acotarse a este
 * conjunto — de lo contrario un admin de un restaurante ve o modifica el
 * de otro restaurante distinto con solo cambiar/adivinar un id.
 */
const sedesDelCliente = async (clienteId) => {
  if (clienteId == null) return [];
  return db('sedes').where('cliente_id', clienteId).pluck('id');
};

/** true si sedeId pertenece al conjunto de sedes del cliente autenticado. */
const sedePerteneceACliente = (sedeId, sedeIds) =>
  sedeId != null && sedeIds.includes(Number(sedeId));

/** Sedes del cliente de quien hace la petición. */
const sedesDeReq = (req) => sedesDelCliente(req.usuario?.cliente_id);

/**
 * Valida un sedeId que llega por query/params/body contra las sedes del
 * cliente autenticado. Úsalo en TODA ruta operativa que reciba una sede:
 * sin esto, cambiar el id en la URL basta para leer otro restaurante.
 *
 * Devuelve { ok: true, sedeId, sedeIds } o { ok: false, status, error }.
 */
const validarSedeDeReq = async (req, sedeId) => {
  if (sedeId == null || sedeId === '') {
    return { ok: false, status: 400, error: 'sedeId es requerido' };
  }
  const sedeIds = await sedesDeReq(req);
  if (!sedePerteneceACliente(sedeId, sedeIds)) {
    return { ok: false, status: 403, error: 'Esa sede no pertenece a tu empresa' };
  }
  return { ok: true, sedeId: Number(sedeId), sedeIds };
};

/**
 * Valida que un registro ya cargado (mesa, orden, comanda, factura...) sea de
 * una sede del cliente autenticado.
 */
const validarRecursoDeReq = async (req, registro, nombre = 'recurso') => {
  if (!registro) {
    return { ok: false, status: 404, error: `${nombre} no encontrado` };
  }
  const sedeIds = await sedesDeReq(req);
  if (!sedePerteneceACliente(registro.sede_id, sedeIds)) {
    return { ok: false, status: 403, error: `Ese ${nombre} no pertenece a tu empresa` };
  }
  return { ok: true, sedeIds };
};

module.exports = {
  sedesDelCliente,
  sedePerteneceACliente,
  sedesDeReq,
  validarSedeDeReq,
  validarRecursoDeReq,
};
