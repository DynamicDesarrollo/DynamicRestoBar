const express = require('express');
require('express-async-errors');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const db = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const productosRoutes = require('./routes/productosRoutes');
const mesasRoutes = require('./routes/mesasRoutes');
const ordenesRoutes = require('./routes/ordenesRoutes');
const kdsRoutes = require('./routes/kdsRoutes');
const cajaRoutes = require('./routes/cajaRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const canalesRoutes = require('./routes/canalesRoutes');
const activacionRoutes = require('./routes/activacionRoutes');
const bridgeRoutes = require('./routes/bridgeRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL_POS || 'http://localhost:3001',
      process.env.FRONTEND_URL_KDS || 'http://localhost:3002',
      process.env.FRONTEND_URL_ADMIN || 'http://localhost:3003',
      'http://192.168.1.34:3001', // IP local para desarrollo
      'http://192.168.1.34:3002',
      'http://192.168.1.34:3003',
    ],
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Aplicación y servidor configurados
// (io se usa localmente en este archivo)

// Middleware de seguridad
app.use(helmet());

// CORS
const corsOptions = {
  origin: function (origin, callback) {
    // En desarrollo, permitir todas las conexiones
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      const allowedOrigins = [
        process.env.FRONTEND_URL_POS || 'http://localhost:3001',
        process.env.FRONTEND_URL_KDS || 'http://localhost:3002',
        process.env.FRONTEND_URL_ADMIN || 'http://localhost:3003',
      ];
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Servir archivos estáticos de fotos de clientes con CORS (definitivo)
const path = require('path');
app.use('/uploads/clientes', (req, res, next) => {
  // Middleware previo para CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use('/uploads/clientes', express.static(path.join(__dirname, 'uploads/clientes'), {
  setHeaders: (res, path, stat) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ========================================
// HEALTH CHECK Y API INFO
// ========================================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'DynamicRestoBar API',
    version: '1.0.0-alpha',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/v1/auth',
      productos: '/api/v1/productos (próximo)',
      ordenes: '/api/v1/ordenes (próximo)',
      comandas: '/api/v1/comandas (próximo)',
      caja: '/api/v1/caja (próximo)',
    },
  });
});

// ========================================
// RUTAS API
// ========================================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/productos', productosRoutes);
app.use('/api/v1/mesas', mesasRoutes);
app.use('/api/v1/ordenes', ordenesRoutes);
app.use('/api/v1/kds', kdsRoutes);
app.use('/api/v1/caja', cajaRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/clientes', clientesRoutes);
app.use('/api/v1/canales', canalesRoutes);
app.use('/api/v1/activar-cuenta', activacionRoutes);
app.use('/api/v1/bridge', bridgeRoutes);
const sedesRoutes = require('./routes/sedesRoutes');
app.use('/api/v1/sedes', sedesRoutes);
const adminEmpresaRoutes = require('./routes/adminEmpresaRoutes');
app.use('/api/v1/admin-empresa', adminEmpresaRoutes);
// Pagos de clientes
const pagosClientesRoutes = require('./routes/pagosClientesRoutes');
app.use('/api/v1/pagos-clientes', pagosClientesRoutes);
const activacionUsuarioRoutes = require('./routes/activacionUsuarioRoutes');
app.use('/api/v1/usuarios', activacionUsuarioRoutes);

// Token de activación (exponer endpoint para obtener token por usuario)
const tokenActivacionRoutes = require('./routes/tokenActivacionRoutes');
app.use('/api/v1/token-activacion', tokenActivacionRoutes);

// ========================================
// SOCKET.IO
// ========================================

io.on('connection', (socket) => {
  console.log(`✅ Usuario conectado: ${socket.id}`);

  // Usuario se une a sala por sede
  socket.on('join-sede', (data) => {
    const room = `sede-${data.sedeId}`;
    socket.join(room);
    console.log(`   └─ Socket ${socket.id} unido a ${room}`);
  });

  // Usuario se une a sala por estación (para KDS)
  socket.on('join-estacion', (data) => {
    const room = `estacion-${data.estacionId}`;
    socket.join(room);
    console.log(`   └─ Socket ${socket.id} unido a ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Usuario desconectado: ${socket.id}`);
  });
});

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
    hint: 'Consulta GET /api para ver endpoints disponibles',
  });
});

// ========================================
// ERROR HANDLER (debe ser último middleware)
// ========================================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

const PORT = process.env.PORT || 5081;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═════════════════════════════════════════════════════════╗
║                                                         ║
║  🍽️  DynamicRestoBar API v1.0.0-alpha                  ║
║  🚀  Servidor ejecutando en puerto ${PORT}              ║
║  🌍  Ambiente: ${(process.env.NODE_ENV || 'development').padEnd(30)}║
║  📚  API: http://localhost:${PORT}/api                   ║
║  🏥  Health: http://localhost:${PORT}/health            ║
║                                                         ║
║  ✅ Express + Socket.IO + PostgreSQL                   ║
║  ✅ JWT Authentication Ready                           ║
║  ✅ Database Connected                                 ║
║                                                         ║
╚═════════════════════════════════════════════════════════╝
  `);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM recibido. Cerrando servidor gracefully...');
  server.close(() => {
    console.log('✅ Servidor HTTP cerrado');
    db.destroy().then(() => {
      console.log('✅ Pool de base de datos destruido');
      process.exit(0);
    });
  });
});

module.exports = app;
