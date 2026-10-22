/**
 * Utility to convert array of JSON documents to clean CSV formatted text
 */
function jsonToCsv(headers, rows) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(h => escapeCell(h.label || h.key)).join(',');
  const rowLines = rows.map(row => {
    return headers.map(h => {
      let val = typeof h.get === 'function' ? h.get(row) : row[h.key];
      return escapeCell(val);
    }).join(',');
  });

  return [headerLine, ...rowLines].join('\r\n');
}

module.exports = {
  jsonToCsv
};
