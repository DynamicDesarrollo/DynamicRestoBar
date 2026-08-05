import React, { useState } from 'react';
import axios from 'axios';
const API_URL = 'http://192.168.1.52:5081/api/v1/activar-cuenta';

const inputStyle = {
  width: '100%',
  padding: '12px 40px 12px 40px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '16px',
  marginBottom: '18px',
  background: '#f7fafc',
  outline: 'none',
  boxSizing: 'border-box',
};

const iconStyle = {
  position: 'absolute',
  left: '16px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#3b82f6',
  fontSize: '20px',
};
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
        color: '#fff',
        fontSize: '22px',
        fontWeight: 'bold',
      }}>
        Token de activación no válido.
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
    }}>
      <div style={{
        maxWidth: 420,
        width: '100%',
        padding: '36px 32px',
        background: '#fff',
        borderRadius: '18px',
        boxShadow: '0 8px 32px rgba(30, 58, 138, 0.18)',
        position: 'relative',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: 18,
        }}>
          <span style={{
            fontWeight: 800,
            fontSize: '2.1rem',
            color: '#1e3a8a',
            letterSpacing: '0.04em',
            fontFamily: 'inherit',
          }}>Dynamic RestoBar</span>
        </div>
        <h2 style={{
          textAlign: 'center',
          marginBottom: 32,
          color: '#2563eb',
          fontWeight: 700,
          fontSize: '2rem',
          letterSpacing: '0.02em',
        }}>Activar Cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <label style={{ fontWeight: 500, color: '#1e3a8a', marginBottom: 6, display: 'block' }}>Nueva Contraseña</label>
            <span style={iconStyle}>
              <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a4 4 0 0 1 4 4v2h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h1V6a4 4 0 0 1 4-4Zm-2 6V6a2 2 0 1 1 4 0v2H8Zm-2 2v6h8v-6H6Zm4 3a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" fill="#2563eb"/></svg>
            </span>
            <input
              type="password"
              value={nuevaContrasena}
              onChange={e => setNuevaContrasena(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
            />
          </div>
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <label style={{ fontWeight: 500, color: '#1e3a8a', marginBottom: 6, display: 'block' }}>Confirmar Contraseña</label>
            <span style={iconStyle}>
              <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a4 4 0 0 1 4 4v2h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h1V6a4 4 0 0 1 4-4Zm-2 6V6a2 2 0 1 1 4 0v2H8Zm-2 2v6h8v-6H6Zm4 3a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" fill="#2563eb"/></svg>
            </span>
            <input
              type="password"
              value={confirmarContrasena}
              onChange={e => setConfirmarContrasena(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              fontSize: '18px',
              border: 'none',
              boxShadow: '0 2px 8px #2563eb33',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
              transition: 'background 0.2s',
            }}>
            {loading ? 'Activando...' : 'Activar Cuenta'}
          </button>
          {mensaje && <div style={{ color: '#22c55e', marginTop: 24, fontWeight: 500, fontSize: '18px', textAlign: 'center' }}>{mensaje}</div>}
          {error && <div style={{ color: '#ef4444', marginTop: 24, fontWeight: 500, fontSize: '18px', textAlign: 'center' }}>{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default ActivarCuenta;
