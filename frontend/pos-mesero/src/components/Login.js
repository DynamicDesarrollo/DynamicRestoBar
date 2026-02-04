import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Card, Tabs, Tab } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { authService } from '../services/api';
import { useAuthStore } from '../stores';
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

const obtenerRutaPorRol = (rol) => {
  return RUTAS_POR_ROL[rol?.nombre] || '/mesas';
};

export default function Login() {
  const navigate = useNavigate();
  const setUsuario = useAuthStore((state) => state.setUsuario);
  const [activeTab, setActiveTab] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login por Email
  const [formEmail, setFormEmail] = useState({
    email: 'juan@dynamicrestobar.com',
    contraseña: '1234',
  });

  // Login por PIN
  const [pin, setPin] = useState('');

  const handleLoginEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('📧 Intentando login con email:', formEmail.email);
      const response = await authService.login(formEmail.email, formEmail.contraseña);
      console.log('✅ Respuesta del servidor:', response.data);
      const { token, usuario } = response.data;

      setUsuario(usuario, token);
      toast.success(`¡Bienvenido, ${usuario.nombre}!`);
      const ruta = obtenerRutaPorRol(usuario.rol);
      navigate(ruta);
    } catch (err) {
      console.error('❌ Error completo:', err);
      console.error('❌ err.response:', err.response);
      console.error('❌ err.response?.data:', err.response?.data);
      const mensaje = err.response?.data?.message || err.response?.data?.error || 'Error en la autenticación';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔍 Intentando login con PIN:', pin); // Debug
      const response = await authService.loginPin(pin.trim());
      const { token, usuario } = response.data;

      setUsuario(usuario, token);
      toast.success(`¡Bienvenido, ${usuario.nombre}!`);
      const ruta = obtenerRutaPorRol(usuario.rol);
      navigate(ruta);
    } catch (err) {
      const mensaje = err.response?.data?.message || err.response?.data?.error || 'PIN incorrecto';
      setError(mensaje);
      toast.error(mensaje);
      console.error('❌ Error PIN:', err.response?.data); // Debug
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="login-container d-flex align-items-center justify-content-center min-vh-100">
      <Card className="login-card" style={{ width: '100%', maxWidth: '450px' }}>
        <Card.Body className="p-5">
          <div className="text-center mb-4">
            <h1 className="mb-2" style={{ fontSize: '2.5rem', color: '#2563eb' }}>
              🍽️
            </h1>
            <h2 className="h3 fw-bold" style={{ color: '#1e40af' }}>DynamicRestoBar</h2>
            <p className="text-muted">Sistema POS para Meseros</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
            {/* TAB: Email/Contraseña */}
            <Tab eventKey="email" title="Email" className="pt-3">
              <Form onSubmit={handleLoginEmail}>
                <Form.Group className="mb-3">
                  <Form.Label>📧 Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="usuario@dinamicrestobar.com"
                    value={formEmail.email}
                    onChange={(e) =>
                      setFormEmail({ ...formEmail, email: e.target.value })
                    }
                    disabled={loading}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>🔒 Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={formEmail.contraseña}
                    onChange={(e) =>
                      setFormEmail({ ...formEmail, contraseña: e.target.value })
                    }
                    disabled={loading}
                    required
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 py-2 fw-bold"
                  disabled={loading}
                  style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
                >
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </Button>
              </Form>
            </Tab>

            {/* TAB: PIN (Tablets) */}
            <Tab eventKey="pin" title="PIN (Tablets)" className="pt-3">
              <Form onSubmit={handleLoginPin}>
                <div className="mb-4">
                  <p className="text-center text-muted small">
                    Ingresa tu PIN de 4 dígitos para acceso rápido
                  </p>
                </div>

                <Form.Group className="mb-4">
                  <Form.Control
                    type="password"
                    placeholder="••••"
                    maxLength="4"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    disabled={loading}
                    required
                    className="text-center fs-3 tracking-widest"
                  />
                </Form.Group>

                {/* Teclado numérico virtual */}
                <div className="numeric-keypad mb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                    <Button
                      key={num}
                      variant="outline-secondary"
                      className="numeric-btn"
                      onClick={() => setPin((p) => p + num)}
                      disabled={loading || pin.length >= 4}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant="outline-primary"
                    className="numeric-btn"
                    onClick={() => setPin(pin.slice(0, -1))}
                    disabled={loading}
                  >
                    ⌫
                  </Button>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 py-2 fw-bold"
                  disabled={loading || pin.length !== 4}
                  style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
                >
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </Button>
              </Form>
            </Tab>
          </Tabs>

          <div className="mt-4 pt-3 border-top">
            <p className="text-center text-muted small mb-0">
              💡 <strong>Credenciales de prueba:</strong>
            </p>
            <p className="text-center text-muted small">
              Email: juan@dynamicrestobar.com<br />
              Contraseña: 1234<br />
              PIN: 5678
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
