import React from 'react';
import { formatMoney } from '../utils/formatters';
import { IconPrinter, IconClose } from './Icons';
import './ComprobanteImpresion.css';

export default function ComprobanteImpresion({ show, onHide, comprobante, sede }) {
  if (!show || !comprobante) return null;

  const esIngreso = comprobante.tipo === 'ingreso';
  const numero = `${esIngreso ? 'ING' : 'EGR'}-${String(comprobante.id).padStart(6, '0')}`;

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(`${fecha.slice(0, 10)}T00:00:00`);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handlePrint = () => window.print();

  return (
    <div className="comprobante-print-overlay">
      <div className="comprobante-print-toolbar no-print">
        <span>Vista previa de impresión</span>
        <div className="comprobante-print-toolbar__actions">
          <button className="btn btn-primary" onClick={handlePrint}>
            <IconPrinter /> Imprimir
          </button>
          <button className="btn btn-secondary" onClick={onHide}>
            <IconClose /> Cerrar
          </button>
        </div>
      </div>

      <div className="comprobante-print-page">
        <div className={`comprobante-doc comprobante-doc--${esIngreso ? 'ingreso' : 'egreso'}`}>
          <div className="comprobante-doc__header">
            <div className="comprobante-doc__negocio">
              <h1>{sede?.nombre || 'DynamicRestoBar'}</h1>
              <p>
                {sede?.direccion && <>{sede.direccion} · </>}
                {sede?.ciudad}
                {sede?.telefono && <> · Tel: {sede.telefono}</>}
              </p>
            </div>
            <div className="comprobante-doc__tipo">
              <span>Comprobante de {esIngreso ? 'Ingreso' : 'Egreso'}</span>
              <strong>{numero}</strong>
            </div>
          </div>

          <div className="comprobante-doc__divider" />

          <div className="comprobante-doc__filas">
            <div className="comprobante-doc__fila">
              <span className="comprobante-doc__label">Fecha</span>
              <span className="comprobante-doc__valor">{formatFecha(comprobante.fecha)}</span>
            </div>
            <div className="comprobante-doc__fila">
              <span className="comprobante-doc__label">Concepto</span>
              <span className="comprobante-doc__valor">{comprobante.concepto_nombre || '-'}</span>
            </div>
            <div className="comprobante-doc__fila">
              <span className="comprobante-doc__label">{esIngreso ? 'Recibido de' : 'Pagado a'}</span>
              <span className="comprobante-doc__valor">{comprobante.beneficiario || '-'}</span>
            </div>
            <div className="comprobante-doc__fila">
              <span className="comprobante-doc__label">Método de pago</span>
              <span className="comprobante-doc__valor">{comprobante.metodo_pago_nombre || 'Sin especificar'}</span>
            </div>
            {comprobante.referencia && (
              <div className="comprobante-doc__fila">
                <span className="comprobante-doc__label">Referencia</span>
                <span className="comprobante-doc__valor">{comprobante.referencia}</span>
              </div>
            )}
          </div>

          <div className="comprobante-doc__monto">
            <span>Valor {esIngreso ? 'recibido' : 'pagado'}</span>
            <strong>{formatMoney(comprobante.monto)}</strong>
          </div>

          {comprobante.observaciones && (
            <div className="comprobante-doc__observaciones">
              <span className="comprobante-doc__label">Observaciones</span>
              <p>{comprobante.observaciones}</p>
            </div>
          )}

          <div className="comprobante-doc__firmas">
            <div className="comprobante-doc__firma">
              <div className="comprobante-doc__firma-linea" />
              <span>Elaborado por{comprobante.usuario_nombre ? `: ${comprobante.usuario_nombre}` : ''}</span>
            </div>
            <div className="comprobante-doc__firma">
              <div className="comprobante-doc__firma-linea" />
              <span>{esIngreso ? 'Recibí conforme' : 'Recibí a satisfacción'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
