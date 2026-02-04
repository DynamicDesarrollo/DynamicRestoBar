import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor para añadir token a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, contraseña) =>
    apiClient.post('/auth/login', { email, contraseña }),
  loginPin: (pin) =>
    apiClient.post('/auth/login-pin', { pin }),
  logout: () =>
    apiClient.post('/auth/logout'),
  getMe: () =>
    apiClient.get('/auth/me'),
  changePassword: (contraseña_actual, contraseña_nueva) =>
    apiClient.post('/auth/change-password', { contraseña_actual, contraseña_nueva }),
};

export const productosService = {
  getAll: (sedeId) =>
    apiClient.get('/productos', { params: { sedeId } }),
  getById: (id) =>
    apiClient.get(`/productos/${id}`),
  getCategorias: (sedeId) =>
    apiClient.get('/productos/categorias', { params: { sedeId } }),
  getModificadores: (id) =>
    apiClient.get(`/productos/modificadores/${id}`),
  getCombos: (sedeId) =>
    apiClient.get('/productos/combos/listar', { params: { sedeId } }),
};

export const ordenesService = {
  crear: (data) =>
    apiClient.post('/ordenes', data),
  actualizar: (id, data) =>
    apiClient.put(`/ordenes/${id}`, data),
  getById: (id) =>
    apiClient.get(`/ordenes/${id}`),
  getByMesa: (mesaId) =>
    apiClient.get(`/ordenes/mesa/${mesaId}`),
  getOrdenesPendientes: () =>
    apiClient.get('/ordenes/estado/abierta'),
  anular: (id) =>
    apiClient.post(`/ordenes/${id}/anular`),
};

export const mesasService = {
  getAll: (sedeId) =>
    apiClient.get('/mesas', { params: { sedeId } }),
  getById: (id) =>
    apiClient.get(`/mesas/${id}`),
};

export const kdsService = {
  getEstacionesPorSede: (sedeId) =>
    apiClient.get(`/kds/estaciones/${sedeId}`),
  getComandaByEstacion: (estacionId) =>
    apiClient.get(`/kds/estacion/${estacionId}`),
  getResumenEstaciones: () =>
    apiClient.get('/kds/resumen'),
  updateEstadoComanda: (comandaId, estado) =>
    apiClient.patch(`/kds/comanda/${comandaId}/estado`, { estado }),
  updateEstadoItem: (itemId, estado) =>
    apiClient.patch(`/kds/item/${itemId}/estado`, { estado }),
};

export const cajaService = {
  // Gestión de caja
  abrirCaja: (data) =>
    apiClient.post('/caja/abrir', data),
  getAperturaActual: () =>
    apiClient.get('/caja/apertura-actual'),
  cerrarCaja: (data) =>
    apiClient.post('/caja/cerrar', data),
  getMetodosPago: () =>
    apiClient.get('/caja/metodos-pago'),

  // Pagos
  registrarPago: (data) =>
    apiClient.post('/caja/pago', data),
  procesarDevolucion: (data) =>
    apiClient.post('/caja/devolucion', data),

  // Legacy
  cerrarOrden: (ordenId, data) =>
    apiClient.post(`/caja/cerrar-orden/${ordenId}`, data),
  getFacturas: (sedeId, params) =>
    apiClient.get(`/caja/facturas/${sedeId}`, { params }),
  getResumen: (sedeId) =>
    apiClient.get(`/caja/resumen/${sedeId}`),
  getResumenHoy: (sedeId) =>
    apiClient.get(`/caja/resumen-hoy/${sedeId}`),
  crearDevolucion: (data) =>
    apiClient.post('/caja/devoluciones', data),
};

export default apiClient;
