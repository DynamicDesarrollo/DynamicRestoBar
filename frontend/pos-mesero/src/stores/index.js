import create from 'zustand';

// Store para órdenes
export const useOrdenStore = create((set, get) => ({
  // Estado de la orden actual
  mesaActual: null,
  items: [],
  cliente: {
    nombre: '',
    telefono: '',
  },
  observaciones: '',
  
  // Setters
  setMesaActual: (mesa) => set({ mesaActual: mesa }),
  
  setCliente: (cliente) => set({ cliente }),
  
  setObservaciones: (obs) => set({ observaciones: obs }),
  
  setItems: (items) => set({ items }),
  
  // Gestión de items
  agregarItem: (producto, cantidad = 1, modificadores = []) =>
    set((state) => {
      const itemExistente = state.items.find(
        (item) => item.producto.id === producto.id &&
                  JSON.stringify(item.modificadores) === JSON.stringify(modificadores)
      );
      
      if (itemExistente) {
        return {
          items: state.items.map((item) =>
            item === itemExistente
              ? { ...item, cantidad: item.cantidad + cantidad }
              : item
          ),
        };
      }
      
      return {
        items: [
          ...state.items,
          {
            id: Date.now(),
            producto,
            cantidad,
            modificadores,
            observacionesEspeciales: '',
          },
        ],
      };
    }),
  
  eliminarItem: (itemId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    })),
  
  actualizarCantidad: (itemId, cantidad) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, cantidad } : item
      ),
    })),
  
  actualizarObservacionesItem: (itemId, observaciones) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, observacionesEspeciales: observaciones } : item
      ),
    })),
  
  limpiarOrden: () =>
    set({
      mesaActual: null,
      items: [],
      cliente: { nombre: '', telefono: '' },
      observaciones: '',
    }),
  
  // Cálculos
  getTotal: () => {
    const state = get();
    return state.items.reduce((total, item) => {
      const precioProducto = item.producto.precio_venta;
      const precioModificadores = item.modificadores.reduce(
        (sum, mod) => sum + (mod.precio_adicional || 0),
        0
      );
      return total + (precioProducto + precioModificadores) * item.cantidad;
    }, 0);
  },
  
  getTotalItems: () => {
    const state = get();
    return state.items.reduce((total, item) => total + item.cantidad, 0);
  },
}));

export const useAuthStore = create((set) => ({
  usuario: localStorage.getItem('usuario')
    ? JSON.parse(localStorage.getItem('usuario'))
    : null,
  token: localStorage.getItem('token') || null,
  
  setUsuario: (usuario, token) => {
    if (usuario) {
      localStorage.setItem('usuario', JSON.stringify(usuario));
      if (usuario.sedeId) {
        localStorage.setItem('sedeId', usuario.sedeId);
      }
    }
    if (token) localStorage.setItem('token', token);
    set({ usuario, token });
  },
  
  logout: () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ usuario: null, token: null });
  },
  
  isAuthenticated: () => !!localStorage.getItem('token'),
}));

export const useMesasStore = create((set, get) => ({
  mesas: [],
  sedeId: localStorage.getItem('sedeId') || null,
  
  setMesas: (mesas) => set({ mesas }),
  setSede: (sedeId) => {
    localStorage.setItem('sedeId', sedeId);
    set({ sedeId });
  },
  
  getMesaById: (id) => {
    const state = get();
    return state.mesas.find((mesa) => mesa.id === id);
  },
  
  actualizarEstadoMesa: (mesaId, estado) =>
    set((state) => ({
      mesas: state.mesas.map((mesa) =>
        mesa.id === mesaId ? { ...mesa, estado } : mesa
      ),
    })),
}));
