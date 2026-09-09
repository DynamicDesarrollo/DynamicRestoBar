import React, { useState } from 'react';
import axios from 'axios';
import logo from '../image/LogoRestoBar.png';
import { IconLock, IconAlert, IconCheck } from '../components/Icons';
import '../components/Login.css';

const API_URL = `${process.env.REACT_APP_API_URL}/activar-cuenta`;

const ActivarCuenta = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    if (!nuevaContrasena || nuevaContrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(API_URL, {
        token,
        nueva_contraseña: nuevaContrasena,
      });
      setMensaje('¡Cuenta activada correctamente! Ya puedes iniciar sesión.');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al activar la cuenta');
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-brand">
          <img src={logo} alt="DynamicRestoBar" className="login-brand__mark" />
          <h1 className="login-brand__title">
            Dynamic<em>Resto</em>Bar
          </h1>
          <div className="login-brand__rule" />
        </div>
        <div className="login-form-panel">
          <div className="login-card">
            <p className="login-card__eyebrow">Activación de cuenta</p>
            <h2 className="login-card__heading">Token no válido</h2>
            <div className="login-alert" role="alert">
              <IconAlert />
              <span>El enlace de activación no incluye un token válido. Solicita uno nuevo al administrador.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="login-card__eyebrow">Activación de cuenta</p>
          <h2 className="login-card__heading">Crea tu contraseña</h2>

          {error && (
            <div className="login-alert" role="alert">
              <IconAlert />
              <span>{error}</span>
            </div>
          )}

          {mensaje && (
            <div className="login-alert login-alert--success" role="status">
              <IconCheck />
              <span>{mensaje}</span>
            </div>
          )}

          {!mensaje && (
            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="activar-password">
                  <IconLock /> Nueva contraseña
                </label>
                <input
                  id="activar-password"
                  className="login-input"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  disabled={loading}
                  minLength={6}
                  required
                />
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="activar-password-confirm">
                  <IconLock /> Confirmar contraseña
                </label>
                <input
                  id="activar-password-confirm"
                  className="login-input"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  disabled={loading}
                  minLength={6}
                  required
                />
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Activando…' : 'Activar cuenta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivarCuenta;
