/**
 * Formatea un valor numérico a formato monetario colombiano
 * @param {number|string} value - Valor a formatear
 * @param {boolean} includeDecimals - Si debe incluir decimales (default: false)
 * @returns {string} - Valor formateado como $1,234 o $1,234.56
 */
export const formatMoney = (value, includeDecimals = false) => {
  if (!value && value !== 0) return '$0';
  
  const numValue = parseFloat(value);
  
  if (includeDecimals) {
    return `$${numValue.toLocaleString('es-CO', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }
  
  return `$${numValue.toLocaleString('es-CO', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })}`;
};

/**
 * Formatea un número sin símbolo de moneda
 * @param {number|string} value - Valor a formatear
 * @param {number} decimals - Número de decimales (default: 0)
 * @returns {string} - Valor formateado como 1,234 o 1,234.56
 */
export const formatNumber = (value, decimals = 0) => {
  if (!value && value !== 0) return '0';
  
  const numValue = parseFloat(value);
  return numValue.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};
