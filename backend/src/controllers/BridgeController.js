const PrintJobService = require('../services/PrintJobService');

class BridgeController {
  static async health(req, res) {
    return res.json({
      success: true,
      service: 'print-bridge-api',
      timestamp: new Date().toISOString(),
    });
  }

  static async nextJob(req, res) {
    try {
      const sedeId = Number(req.params.sedeId);
      const agenteId = req.headers['x-bridge-id'] || 'bridge-agent';

      if (!sedeId) {
        return res.status(400).json({ error: 'sedeId inválido' });
      }

      const job = await PrintJobService.claimNext({ sedeId, agenteId });
      return res.json({ success: true, data: job || null });
    } catch (err) {
      console.error('❌ bridge nextJob:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  static async markDone(req, res) {
    try {
      const jobId = Number(req.params.id);
      if (!jobId) {
        return res.status(400).json({ error: 'job id inválido' });
      }

      const result = await PrintJobService.markDone({ jobId });
      if (!result) {
        return res.status(404).json({ error: 'Job no encontrado' });
      }

      return res.json({ success: true, data: result });
    } catch (err) {
      console.error('❌ bridge markDone:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  static async markFailed(req, res) {
    try {
      const jobId = Number(req.params.id);
      if (!jobId) {
        return res.status(400).json({ error: 'job id inválido' });
      }

      const errorMessage = req.body?.error || 'Error de impresión no especificado';
      const result = await PrintJobService.markFailed({ jobId, errorMessage });
      if (!result) {
        return res.status(404).json({ error: 'Job no encontrado' });
      }

      return res.json({ success: true, data: result });
    } catch (err) {
      console.error('❌ bridge markFailed:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = BridgeController;
