import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../../stores';
import AdminLayout from '../AdminLayout';
import { IconQrCode, IconInfo } from '../../../components/Icons';
import '../admin.css';

const ConfiguracionMenuDigital = () => {
  const usuario = useAuthStore((state) => state.usuario);
  const [copiado, setCopiado] = useState(false);

  const habilitado = !!usuario?.menuDigitalHabilitado;
  const sedeId = usuario?.sedeId || usuario?.sede_id;
  const baseUrl = process.env.REACT_APP_MENU_DIGITAL_URL;
  const link = baseUrl && sedeId ? `${baseUrl}/?sede=${sedeId}` : null;

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      toast.success('Link copiado');
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error('No se pudo copiar el link');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-section">
        <div className="section-header">
          <h2><IconQrCode /> Menú Digital</h2>
        </div>

        {!habilitado ? (
          <div style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            background: 'rgba(201, 154, 70, 0.1)', border: '1px solid rgba(201, 154, 70, 0.35)',
            borderRadius: 10, padding: 16,
          }}>
            <IconInfo style={{ flexShrink: 0, marginTop: 2, color: 'var(--rb-gold-300)' }} />
            <p style={{ margin: 0, color: 'var(--rb-cream-500)' }}>
              El menú digital es un valor agregado que aún no está habilitado para tu empresa.
              Contacta a soporte de DynamicRestoBar si te interesa activarlo.
            </p>
          </div>
        ) : !link ? (
          <p style={{ color: 'var(--rb-cream-500)' }}>
            El menú digital está habilitado, pero todavía no hay un link configurado para tu sede.
            Contacta a soporte.
          </p>
        ) : (
          <>
            <p style={{ fontSize: '0.85rem', color: 'var(--rb-cream-500)', marginBottom: 16 }}>
              Comparte este link con tus comensales (imprímelo, ponlo en un tent card en cada mesa,
              o pégalo en tus redes) para que vean el menú desde su celular y puedan llamar a su
              mesero cuando quieran pedir.
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
                className="form-control"
                style={{ flex: '1 1 320px', minWidth: 0 }}
              />
              <button className="btn btn-primary" onClick={handleCopiar}>
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ConfiguracionMenuDigital;
