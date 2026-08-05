const db = require('../config/database');

const PagosClientesController = {
  async listar(req, res) {
    const pagos = await db('pagos_clientes').select('*');
    res.json(pagos);
  },

  async crear(req, res) {
    const { cliente_id, monto, fecha, metodo, observaciones } = req.body;
    const [pago] = await db('pagos_clientes')
      .insert({ cliente_id, monto, fecha, metodo, observaciones })
      .returning('*');
    res.status(201).json(pago);
  },

  async obtener(req, res) {
    const { id } = req.params;
    const pago = await db('pagos_clientes').where({ id }).first();
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(pago);
  },

  async actualizar(req, res) {
    const { id } = req.params;
    const { cliente_id, monto, fecha, metodo, observaciones } = req.body;
    const [pago] = await db('pagos_clientes')
      .where({ id })
      .update({ cliente_id, monto, fecha, metodo, observaciones })
      .returning('*');
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(pago);
  },

  async eliminar(req, res) {
    const { id } = req.params;
    await db('pagos_clientes').where({ id }).del();
    res.json({ success: true });
  }
};

module.exports = PagosClientesController;
