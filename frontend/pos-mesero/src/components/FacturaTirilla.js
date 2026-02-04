import React, { useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useReactToPrint } from 'react-to-print';
import './FacturaTirilla.css';


export default function FacturaTirilla({ show, onHide, factura, orden, pagos }) {
  const componentRef = useRef();
  const printReadyRef = useRef(false);
  const [canPrint, setCanPrint] = React.useState(false);

  // Solo permitir imprimir cuando el contenido está montado
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Factura-${factura?.numero_factura || 'N/A'}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
      }
    `,
    removeAfterPrint: true,
  });

  // Cuando el modal termina de entrar, habilitar impresión
  const handleModalEntered = () => {
    setTimeout(() => {
      setCanPrint(!!componentRef.current);
    }, 100); // pequeño delay para asegurar render
  };

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
    const subtotal = calcularSubtotal();
    return subtotal * 0.08; // 8% IVA ejemplo
  };

  if (!factura || !orden) return null;

  const subtotal = calcularSubtotal();
  const impuestos = calcularImpuestos();
  const total = orden.total || subtotal + impuestos;
  const montoPagado = pagos?.reduce((sum, p) => sum + parseFloat(p.monto), 0) || 0;
  const cambio = montoPagado - total;

  return (
    <Modal show={show} onHide={onHide} size="sm" centered onEntered={handleModalEntered}>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>Factura Generada</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0">
        <div ref={componentRef} className="factura-tirilla">
          {/* Header */}
          <div className="tirilla-header">
            <h1 className="restaurant-name">DynamicRestoBar</h1>
            <p className="restaurant-info">
              Calle Principal #123<br />
              Medellín, Colombia<br />
              Tel: (4) 444-5678<br />
              NIT: 900.123.456-7
            </p>
          </div>

          <div className="tirilla-divider">═══════════════════════════════</div>

          {/* Información de factura */}
          <div className="factura-info">
            <p><strong>FACTURA:</strong> {factura.numero_factura}</p>
            <p><strong>FECHA:</strong> {formatDate(factura.created_at)}</p>
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
            {impuestos > 0 && (
              <div className="total-row">
                <span>IVA (8%):</span>
                <span>${impuestos.toLocaleString()}</span>
              </div>
            )}
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
            <p className="web">www.dynamicrestobar.com</p>
            <br />
            <p className="legal">
              Factura válida como comprobante de venta<br />
              Resolución DIAN #123456 del 01/01/2025<br />
              Rango autorizado: FAC-000001 a FAC-999999
            </p>
          </div>

          <div className="print-timestamp">
            Impreso: {new Date().toLocaleString('es-ES')}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        <Button 
          variant="primary" 
          onClick={handlePrint}
          style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
          disabled={!canPrint}
        >
          🖨️ Imprimir Factura
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
