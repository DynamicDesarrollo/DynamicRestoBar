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
const menuDigitalPublicoRoutes = require('./routes/menuDigitalPublicoRoutes');
const domiciliosRoutes = require('./routes/domiciliosRoutes');
const domiciliosPublicoRoutes = require('./routes/domiciliosPublicoRoutes');

const app = express();
const server = http.createServer(app);

// ========================================
// ORÍGENES PERMITIDOS (CORS y Socket.IO)
// ========================================

const allowedOrigins = [
  process.env.FRONTEND_URL_POS || 'http://localhost:3001',
  process.env.FRONTEND_URL_KDS || 'http://localhost:3002',
  process.env.FRONTEND_URL_ADMIN || 'http://localhost:3003',
  // App standalone del repartidor (login real, JWT) — a diferencia del menú
  // digital y el seguimiento de domicilios (públicos, sin credentials), esta
  // sí necesita quedar en el allowlist estricto.
  process.env.FRONTEND_URL_DOMICILIOS || 'http://localhost:5174',
];

// Origen de red local (localhost o IP privada), para que fuera de producción
// se pueda entrar desde otro equipo de la misma red sin abrir el CORS a
// cualquier sitio de internet. Esto importa porque el backend se instala en
// el PC del cliente para imprimir y ese despliegue suele quedar con
// NODE_ENV=development.
const esOrigenDeRedLocal = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch {
    return false;
  }
};

const origenPermitido = (origin) => {
  // Sin origin: peticiones del propio servidor, curl, apps de escritorio.
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return process.env.NODE_ENV !== 'production' && esOrigenDeRedLocal(origin);
};

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (origenPermitido(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Middleware de seguridad
app.use(helmet());

const corsOptions = {
  origin: (origin, callback) => {
    if (origenPermitido(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

// El menú digital lo abre el comensal sin login desde un dominio propio,
// separado del resto de la app (hoy aurum-menu-resto-bar.vercel.app, mañana
// posiblemente un dominio por restaurante) — no tiene sentido mantenerlo en
// el allowlist fijo de allowedOrigins, así que se salta ese CORS estricto y
// usa uno propio abierto a cualquier origen. Es seguro porque el endpoint no
// usa cookies/sesión (sin credentials) y valida tenant/sede/mesa él mismo.
// El seguimiento de domicilios (comensal, sin login) es igual de público que
// el menú digital — mismo carve-out, mismo motivo.
const RUTAS_PUBLICAS_ABIERTAS = ['/api/v1/menu-digital', '/api/v1/domicilios-publico'];
app.use((req, res, next) => {
  if (RUTAS_PUBLICAS_ABIERTAS.some((ruta) => req.path.startsWith(ruta))) return next();
  return cors(corsOptions)(req, res, next);
});
app.use('/api/v1/menu-digital', cors({ origin: true }));
app.use('/api/v1/domicilios-publico', cors({ origin: true }));

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

// Servir archivos estáticos de fotos de productos (platos) con CORS
app.use('/uploads/productos', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use('/uploads/productos', express.static(path.join(__dirname, 'uploads/productos'), {
  setHeaders: (res, path, stat) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Servir archivos estáticos de adjuntos de comprobantes (foto/PDF) con CORS
app.use('/uploads/comprobantes', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use('/uploads/comprobantes', express.static(path.join(__dirname, 'uploads/comprobantes'), {
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
// Menú digital público (comensal, sin login) — ver comentario en el router.
app.use('/api/v1/menu-digital', menuDigitalPublicoRoutes);
app.use('/api/v1/domicilios', domiciliosRoutes);
// Seguimiento de domicilio público (comensal, sin login).
app.use('/api/v1/domicilios-publico', domiciliosPublicoRoutes);
const sedesRoutes = require('./routes/sedesRoutes');
app.use('/api/v1/sedes', sedesRoutes);
// Pagos de clientes (facturación del SaaS: solo super-admin)
const pagosClientesRoutes = require('./routes/pagosClientesRoutes');
app.use('/api/v1/pagos-clientes', pagosClientesRoutes);

// Token de activación (exponer endpoint para obtener token por usuario)
const tokenActivacionRoutes = require('./routes/tokenActivacionRoutes');
app.use('/api/v1/token-activacion', tokenActivacionRoutes);

// ========================================
// SOCKET.IO
// ========================================

// Throttle de escritura a domicilio_tracking por entrega — el socket puede
// emitir posición cada 1-2s, pero no hace falta persistir cada ping.
const ultimaPersistenciaTracking = new Map();

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

  // El repartidor (autenticado, ya sabe su propio entregaId) se une directo.
  socket.on('join-domicilio-conductor', (data) => {
    const room = `domicilio-${data.entregaId}`;
    socket.join(room);
    console.log(`   └─ Socket ${socket.id} (repartidor) unido a ${room}`);
  });

  // El comensal (público, sin login) solo puede unirse si conoce el
  // tracking_token de SU entrega — nunca se le deja unir por id directo.
  socket.on('join-domicilio-seguimiento', async (data) => {
    try {
      const entrega = await db('domicilio_entregas')
        .where('tracking_token', data?.token)
        .whereNull('deleted_at')
        .first();
      if (!entrega) return;
      const room = `domicilio-${entrega.id}`;
      socket.join(room);
      console.log(`   └─ Socket ${socket.id} (seguimiento) unido a ${room}`);
    } catch (err) {
      console.error('❌ Error uniendo a sala de seguimiento:', err.message);
    }
  });

  // El repartidor emite su posición mientras va en camino; se retransmite en
  // vivo a la sala y, cada ~20s por entrega, se guarda como breadcrumb en
  // domicilio_tracking (para que quien recargue la página de seguimiento
  // tenga un último punto conocido antes de que conecte el socket).
  socket.on('domicilio:posicion', async (data) => {
    const { entregaId, lat, lng } = data || {};
    if (!entregaId || typeof lat !== 'number' || typeof lng !== 'number') return;

    const room = `domicilio-${entregaId}`;
    io.to(room).emit('domicilio:posicion', { lat, lng, hora: new Date().toISOString() });

    const ahora = Date.now();
    const ultimoGuardado = ultimaPersistenciaTracking.get(entregaId) || 0;
    if (ahora - ultimoGuardado < 20000) return;
    ultimaPersistenciaTracking.set(entregaId, ahora);

    try {
      await db('domicilio_tracking').insert({
        domicilio_entrega_id: entregaId,
        latitud: lat,
        longitud: lng,
        created_at: new Date(),
        updated_at: new Date(),
      });
    } catch (err) {
      console.error('❌ Error guardando tracking de domicilio:', err.message);
    }
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
