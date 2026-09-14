import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuthStore } from '../../../stores';
import AdminLayout from '../AdminLayout';
import { IconQrCode, IconInfo } from '../../../components/Icons';
import '../admin.css';

const ConfiguracionMenuDigital = () => {
  const usuario = useAuthStore((state) => state.usuario);
  const [copiado, setCopiado] = useState(false);
  const qrRef = useRef(null);

  const habilitado = !!usuario?.menuDigitalHabilitado;
  const sedeId = usuario?.sedeId || usuario?.sede_id;
  const baseUrl = process.env.REACT_APP_MENU_DIGITAL_URL;
  const link = baseUrl && sedeId ? `${baseUrl}/?sede=${sedeId}` : null;
  const nombreRestaurante = usuario?.nombre || 'Nuestro restaurante';

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

  const handleDescargarQr = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `menu-digital-qr-sede-${sedeId}.png`;
    a.click();
  };

  const handleImprimirQr = () => {
    window.print();
  };

  return (
    <AdminLayout>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .qr-print-area, .qr-print-area * { visibility: visible; }
          .qr-print-area {
            position: fixed;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
          }
        }
      `}</style>
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

            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--rb-border, rgba(255,255,255,0.08))' }}>
              <h3 className="admin-subtitle" style={{ marginBottom: 4 }}>Código QR para imprimir</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--rb-cream-500)', marginBottom: 16 }}>
                Ponlo en cada mesa (tent card, sticker o mantel individual) para que el comensal
                escanee y entre directo al menú.
              </p>

              <div
                ref={qrRef}
                className="qr-print-area"
                style={{
                  display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  background: '#ffffff', padding: 24, borderRadius: 12,
                }}
              >
                <QRCodeCanvas value={link} size={220} level="M" marginSize={2} bgColor="#ffffff" fgColor="#000000" />
                <p style={{ margin: 0, color: '#11100d', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
                  {nombreRestaurante}
                </p>
                <p style={{ margin: 0, color: '#4a4238', fontSize: '0.75rem', textAlign: 'center' }}>
                  Escanea y descubre nuestro menú
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-primary" onClick={handleDescargarQr}>Descargar QR</button>
                <button className="btn btn-secondary" onClick={handleImprimirQr}>Imprimir QR</button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ConfiguracionMenuDigital;
