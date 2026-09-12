import { toast } from 'react-toastify';
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../stores';
import logo from '../image/LogoRestoBar.png';
import { IconMail, IconLock, IconKeypad, IconAlert, IconBackspace, IconArrowLeft } from './Icons';
import './Login.css';

// Mapeo de rutas según rol
const RUTAS_POR_ROL = {
  'Administrador': '/admin',
  'Cocina': '/kds',
  'Mesero': '/mesas',
  'Bar': '/kds',
  'Caja': '/caja',
  'Repartidor': '/mesas',
  'Gerente': '/admin',
};

const obtenerRutaPorRol = (rol, usuario) => {
  // Si el usuario es Super Admin SaaS (rol_id 8 y cliente_id null), redirigir a /superadmin/clientes
  if (rol?.id === 8 && (!usuario?.cliente_id || usuario?.cliente_id === null)) {
    return '/superadmin/clientes';
  }
  // Si es Administrador de Empresa (rol_id 8 y cliente_id no null), redirigir a /admin
  if (rol?.id === 8 && usuario?.cliente_id) {
    return '/admin';
  }
  return RUTAS_POR_ROL[rol?.nombre] || '/mesas';
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = useAuthStore((state) => state.usuario);
  const setUsuario = useAuthStore((state) => state.setUsuario);

  const [activeTab, setActiveTab] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login por Email
  const [formEmail, setFormEmail] = useState({
    email: '',
    contraseña: '',
  });

  // Login por PIN
  const [pin, setPin] = useState('');
  // Cuando el PIN existe en más de un restaurante, SIEMPRE se pide el correo
  // asociado (sin excepción y sin "recordar" el dispositivo) — el correo +
  // el PIN juntos identifican una única cuenta real.
  const [pinRequiereCorreo, setPinRequiereCorreo] = useState(false);
  const [correoDesambiguar, setCorreoDesambiguar] = useState('');

  // Redirección automática usando useEffect para evitar bucles infinitos
  React.useEffect(() => {
    if (usuario && location.pathname === '/login') {
      const ruta = obtenerRutaPorRol(usuario.rol, usuario);
      if (ruta !== '/login') {
        navigate(ruta, { replace: true });
      }
    }
  }, [usuario, location.pathname, navigate]);

  const handleLoginEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formEmail.email, formEmail.contraseña);
      const { token, usuario } = response.data;

      setUsuario(usuario, token);
      toast.success(`¡Bienvenido, ${usuario.nombre}!`);
      const ruta = obtenerRutaPorRol(usuario.rol, usuario);
      navigate(ruta);
    } catch (err) {
      const mensaje = err.response?.data?.message || err.response?.data?.error || 'Error en la autenticación';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const intentarLoginPin = async (email) => {
    setError('');
    setLoading(true);

    try {
      const response = await authService.loginPin(pin.trim(), email);
      const { token, usuario } = response.data;

      setUsuario(usuario, token);
      toast.success(`¡Bienvenido, ${usuario.nombre}!`);
      const ruta = obtenerRutaPorRol(usuario.rol, usuario);
      navigate(ruta);
    } catch (err) {
      if (err.response?.data?.code === 'PIN_AMBIGUO') {
        setPinRequiereCorreo(true);
        setError('');
        return;
      }
      const mensaje = err.response?.data?.message || err.response?.data?.error || 'PIN incorrecto';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPin = (e) => {
    e.preventDefault();
    intentarLoginPin();
  };

  const handleConfirmarCorreoPin = (e) => {
    e.preventDefault();
    intentarLoginPin(correoDesambiguar.trim());
  };

  const handleVolverAlPin = () => {
    setPinRequiereCorreo(false);
    setCorreoDesambiguar('');
    setPin('');
    setError('');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setPinRequiereCorreo(false);
    setCorreoDesambiguar('');
  };

  return (
    <div className="login-page">
      {/* Panel de marca */}
      <div className="login-brand">
        <img src={logo} alt="DynamicRestoBar" className="login-brand__mark" />
        <h1 className="login-brand__title">
          Dynamic<em>Resto</em>Bar
        </h1>
        <div className="login-brand__rule" />
        <p className="login-brand__tagline">
          El sistema que lleva el ritmo de la barra, la cocina y el salón — sin perder ningún pedido.
        </p>
      </div>

      {/* Panel de formulario */}
      <div className="login-form-panel">
        <div className="login-card">
          <p className="login-card__eyebrow">Acceso al sistema</p>
          <h2 className="login-card__heading">Bienvenido de nuevo</h2>

          {error && (
            <div className="login-alert" role="alert">
              <IconAlert />
              <span>{error}</span>
            </div>
          )}

          <div className="login-switch" role="tablist" aria-label="Método de acceso">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'email'}
              className={`login-switch__btn ${activeTab === 'email' ? 'is-active' : ''}`}
              onClick={() => handleTabChange('email')}
            >
              <IconMail /> Email
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pin'}
              className={`login-switch__btn ${activeTab === 'pin' ? 'is-active' : ''}`}
              onClick={() => handleTabChange('pin')}
            >
              <IconKeypad /> PIN
            </button>
          </div>

          {activeTab === 'email' ? (
            <form onSubmit={handleLoginEmail}>
              <div className="login-field">
                <label className="login-label" htmlFor="login-email">
                  <IconMail /> Email
                </label>
                <input
                  id="login-email"
                  className="login-input"
                  type="email"
                  placeholder="usuario@dynamicrestobar.com"
                  value={formEmail.email}
                  onChange={(e) => setFormEmail({ ...formEmail, email: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="login-password">
                  <IconLock /> Contraseña
                </label>
                <input
                  id="login-password"
                  className="login-input"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={formEmail.contraseña}
                  onChange={(e) => setFormEmail({ ...formEmail, contraseña: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>
          ) : pinRequiereCorreo ? (
            <form onSubmit={handleConfirmarCorreoPin}>
              <p className="login-pin-hint">
                Por seguridad, digita tu correo asociado.
              </p>
              <div className="login-field">
                <label className="login-label" htmlFor="login-pin-email">
                  <IconMail /> Email
                </label>
                <input
                  id="login-pin-email"
                  className="login-input"
                  type="email"
                  placeholder="usuario@dynamicrestobar.com"
                  value={correoDesambiguar}
                  onChange={(e) => setCorreoDesambiguar(e.target.value)}
                  disabled={loading}
                  autoFocus
                  required
                />
              </div>
              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Ingresando…' : 'Ingresar'}
              </button>
              <button type="button" className="login-switch__btn" style={{ marginTop: 10, width: '100%' }} onClick={handleVolverAlPin}>
                <IconArrowLeft /> Volver
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginPin}>
              <p className="login-pin-hint">Ingresa tu PIN de 4 dígitos para acceso rápido</p>

              <div className="login-pin-display" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`login-pin-dot ${pin[i] ? 'is-filled' : ''}`}>
                    {pin[i] ? '•' : ''}
                  </div>
                ))}
              </div>

              <div className="numeric-keypad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className="keypad-btn"
                    onClick={() => setPin((p) => (p.length < 4 ? p + num : p))}
                    disabled={loading || pin.length >= 4}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  className="keypad-btn keypad-btn--ghost"
                  onClick={() => setPin('')}
                  disabled={loading || pin.length === 0}
                  aria-label="Borrar todo"
                >
                  C
                </button>
                <button
                  key={0}
                  type="button"
                  className="keypad-btn"
                  onClick={() => setPin((p) => (p.length < 4 ? p + '0' : p))}
                  disabled={loading || pin.length >= 4}
                >
                  0
                </button>
                <button
                  type="button"
                  className="keypad-btn keypad-btn--ghost"
                  onClick={() => setPin((p) => p.slice(0, -1))}
                  disabled={loading || pin.length === 0}
                  aria-label="Borrar último dígito"
                >
                  <IconBackspace />
                </button>
              </div>

              <button type="submit" className="login-submit" disabled={loading || pin.length !== 4}>
                {loading ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}