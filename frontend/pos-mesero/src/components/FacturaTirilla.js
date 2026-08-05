import React, { useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import './FacturaTirilla.css';


export default function FacturaTirilla({ show, onHide, factura, orden, pagos }) {
  const AUTO_CLOSE_MS = 2000;

  useEffect(() => {
    if (!show) return undefined;

    const timeoutId = setTimeout(() => {
      if (typeof onHide === 'function') onHide();
    }, AUTO_CLOSE_MS);

    return () => clearTimeout(timeoutId);
  }, [show, onHide]);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calcularSubtotal = () => {
    return orden?.items?.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0) || orden?.total || 0;
  };

  const calcularImpuestos = () => {
    return 0;
  };

  if (!factura || !orden) return null;

  const subtotal = calcularSubtotal();
  const impuestos = calcularImpuestos();
  const total = factura?.total || orden.total || subtotal;
  const montoPagado = pagos?.reduce((sum, p) => sum + parseFloat(p.monto), 0) || 0;
  const cambio = montoPagado - total;
  const negocio = factura?.negocio || {};
  const nombreNegocio = negocio.nombre || 'DynamicRestoBar';
  const direccionNegocio = negocio.direccion || '';
  const ciudadNegocio = negocio.ciudad || '';
  const telefonoNegocio = negocio.telefono || '';
  const nitNegocio = negocio.nit || '';
  const webNegocio = negocio.web || 'www.dynamicrestobar.com';
  const resolucionNegocio = negocio.resolucion || 'Resolución DIAN #123456 del 01/01/2025';

  return (
    <Modal show={show} onHide={onHide} size="sm" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>Factura Generada</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0">
        <div className="factura-tirilla">
          {/* Header */}
          <div className="tirilla-header">
            <h1 className="restaurant-name">{nombreNegocio}</h1>
            <p className="restaurant-info">
              {direccionNegocio && <>{direccionNegocio}<br /></>}
              {ciudadNegocio && <>{ciudadNegocio}<br /></>}
              {telefonoNegocio && <>Tel: {telefonoNegocio}<br /></>}
              {nitNegocio && <>NIT: {nitNegocio}</>}
            </p>
          </div>

          <div className="tirilla-divider">═══════════════════════════════</div>

          {/* Información de factura */}
          <div className="factura-info">
            <p><strong>FACTURA:</strong> {factura.numero_factura}</p>
            <p><strong>FECHA:</strong> {formatDate(factura.fecha_hora || factura.created_at || factura.fecha_emision)}</p>
            <p><strong>MESA:</strong> {orden.mesa_numero || 'N/A'}</p>
            <p><strong>ORDEN:</strong> #{orden.numero_orden}</p>
            {orden.usuario_nombre && <p><strong>MESERO:</strong> {orden.usuario_nombre}</p>}
          </div>

          <div className="tirilla-divider">═══════════════════════════════</div>

          {/* Items */}
          <div className="items-section">
            <table className="items-table">
              <thead>
                <tr>
                  <th>CANT</th>
                  <th>DESCRIPCIÓN</th>
                  <th className="text-right">VALOR</th>
                </tr>
              </thead>
              <tbody>
                {orden.items?.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td>{item.cantidad}</td>
                      <td>
                        {item.producto_nombre}
                        {item.modificadores?.length > 0 && (
                          <div className="modificadores-print">
                            {item.modificadores.map((mod, i) => (
                              <span key={i} className="mod-item">
                                + {mod.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.observaciones && (
                          <div className="observaciones-print">
                            Obs: {item.observaciones}
                          </div>
                        )}
                      </td>
                      <td className="text-right">
                        ${(item.cantidad * item.precio_unitario).toLocaleString()}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tirilla-divider">─────────────────────────────</div>

          {/* Totales */}
          <div className="totales-section">
            <div className="total-row">
              <span>SUBTOTAL:</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className="total-row total-final">
              <span><strong>TOTAL:</strong></span>
              <span><strong>${total.toLocaleString()}</strong></span>
            </div>
          </div>

          <div className="tirilla-divider">═══════════════════════════════</div>

          {/* Información de pago */}
          <div className="pago-section">
            <p><strong>MÉTODOS DE PAGO:</strong></p>
            {pagos?.map((pago, index) => (
              <div key={index} className="pago-detalle">
                <span>{pago.metodo_nombre || 'Efectivo'}:</span>
                <span>${parseFloat(pago.monto).toLocaleString()}</span>
                {pago.referencia && (
                  <div className="pago-referencia">
                    Ref: {pago.referencia}
                  </div>
                )}
              </div>
            ))}
            
            <div className="pago-total">
              <span><strong>PAGADO:</strong></span>
              <span><strong>${montoPagado.toLocaleString()}</strong></span>
            </div>
            
            {cambio > 0 && (
              <div className="pago-cambio">
                <span><strong>CAMBIO:</strong></span>
                <span><strong>${cambio.toLocaleString()}</strong></span>
              </div>
            )}
          </div>

          <div className="tirilla-divider">═══════════════════════════════</div>

          {/* Footer */}
          <div className="tirilla-footer">
            <p className="gracias">¡GRACIAS POR SU VISITA!</p>
            <p className="mensaje">Vuelva pronto</p>
            <p className="web">{webNegocio}</p>
            <br />
            <p className="legal">
              Factura válida como comprobante de venta<br />
              {resolucionNegocio}<br />
              Rango autorizado: FAC-000001 a FAC-999999
            </p>
          </div>

          <div className="print-timestamp">
            Impreso: {new Date().toLocaleString('es-ES')}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <small className="text-muted me-auto">
          Factura enviada automaticamente a impresora de red. Esta ventana se cerrara en 2 segundos.
        </small>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
