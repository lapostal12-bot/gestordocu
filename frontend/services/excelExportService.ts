import { AppDocument, Client } from '../types';

export function generateDeliveryNotesExcelTemplate(): void {
  // Plantilla oficial vacía con cabeceras y 2 filas de ejemplo para el usuario o su ERP
  const headers = [
    'FECHA_ALBARAN',
    'NUMERO_ALBARAN',
    'NIF_PROVEEDOR',
    'NOMBRE_PROVEEDOR',
    'COD_CLIENTE',
    'NOMBRE_CLIENTE',
    'ESTABLECIMIENTO',
    'DESCRIPCION_ORIGINAL',
    'PRODUCTO_NORMALIZADO',
    'CANTIDAD',
    'UNIDAD',
    'PRECIO_UNITARIO_SIN_IVA',
    'PORCENTAJE_DESCUENTO',
    'BASE_LINEA',
    'PORCENTAJE_IVA',
    'CUOTA_IVA_LINEA',
    'TOTAL_LINEA',
    'TOTAL_ALBARAN',
    'ESTADO_VALIDACION',
    'FECHA_VALIDACION'
  ];

  const exampleRow1 = [
    '2025-02-20',
    'ALB-2025-1042',
    'A28019283',
    'Distribuciones del Campo S.A.',
    'CLI-001',
    'Restaurante El Fogón',
    'Sede Centro',
    'Solomillo de Ternera Rubia Gallega',
    'Solomillo de Ternera',
    '12.50',
    'KG',
    '19.50',
    '0.00',
    '243.75',
    '10',
    '24.38',
    '268.13',
    '343.75',
    'CONFIRMADO',
    '2025-02-20 11:30'
  ];

  const exampleRow2 = [
    '2025-02-20',
    'ALB-2025-1042',
    'A28019283',
    'Distribuciones del Campo S.A.',
    'CLI-001',
    'Restaurante El Fogón',
    'Sede Centro',
    'Aceite de Oliva Virgen Extra 5L',
    'Aceite de Oliva Virgen Extra',
    '2.00',
    'GARRAFA',
    '34.38',
    '0.00',
    '68.75',
    '10',
    '6.88',
    '75.63',
    '343.75',
    'CONFIRMADO',
    '2025-02-20 11:30'
  ];

  const csvRows = [
    headers.join(';'),
    exampleRow1.join(';'),
    exampleRow2.join(';')
  ];

  // Añadir BOM para que Microsoft Excel en español abra los acentos y números con punto y coma sin descolocar columnas
  const blob = new Blob(['﻿' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'RSG_Gestudoc_Plantilla_Albaranes.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportDocumentsToExcelTemplate(documents: AppDocument[], clientFilterName?: string): void {
  const headers = [
    'FECHA_ALBARAN',
    'NUMERO_ALBARAN',
    'NIF_PROVEEDOR',
    'NOMBRE_PROVEEDOR',
    'COD_CLIENTE',
    'NOMBRE_CLIENTE',
    'ESTABLECIMIENTO',
    'DESCRIPCION_ORIGINAL',
    'PRODUCTO_NORMALIZADO',
    'CANTIDAD',
    'UNIDAD',
    'PRECIO_UNITARIO_SIN_IVA',
    'PORCENTAJE_DESCUENTO',
    'BASE_LINEA',
    'PORCENTAJE_IVA',
    'CUOTA_IVA_LINEA',
    'TOTAL_LINEA',
    'TOTAL_ALBARAN',
    'ESTADO_VALIDACION',
    'FECHA_VALIDACION'
  ];

  const rows: string[] = [headers.join(';')];

  documents.forEach(doc => {
    const data = doc.deliveryNoteData;
    if (!data) return;

    if (data.items && data.items.length > 0) {
      data.items.forEach(item => {
        const discountVal = (item.quantity * item.unitPrice * (item.discountPercent || 0)) / 100;
        const lineBase = (item.quantity * item.unitPrice) - discountVal;
        const lineVat = (lineBase * (item.vatPercent || 0)) / 100;
        const lineTot = lineBase + lineVat;

        const row = [
          data.documentDate || '',
          data.documentNumber || '',
          data.supplierNif || '',
          `"${(data.supplierName || '').replace(/"/g, '""')}"`,
          doc.clientId,
          `"${(doc.clientName || '').replace(/"/g, '""')}"`,
          `"${(doc.establishment || 'Principal').replace(/"/g, '""')}"`,
          `"${(item.originalDescription || '').replace(/"/g, '""')}"`,
          `"${(item.normalizedProduct || '').replace(/"/g, '""')}"`,
          item.quantity.toFixed(2),
          item.unit || 'UNIDAD',
          item.unitPrice.toFixed(2),
          (item.discountPercent || 0).toFixed(2),
          lineBase.toFixed(2),
          (item.vatPercent || 0).toString(),
          lineVat.toFixed(2),
          lineTot.toFixed(2),
          data.totalAmount.toFixed(2),
          doc.status,
          data.confirmedAt || ''
        ];
        rows.push(row.join(';'));
      });
    } else {
      // Albarán sin líneas desglosadas
      const row = [
        data.documentDate || '',
        data.documentNumber || '',
        data.supplierNif || '',
        `"${(data.supplierName || '').replace(/"/g, '""')}"`,
        doc.clientId,
        `"${(doc.clientName || '').replace(/"/g, '""')}"`,
        `"${(doc.establishment || 'Principal').replace(/"/g, '""')}"`,
        'Albarán general',
        'Albarán general',
        '1.00',
        'DOC',
        data.subtotal.toFixed(2),
        '0.00',
        data.subtotal.toFixed(2),
        '10',
        data.vatAmount.toFixed(2),
        data.totalAmount.toFixed(2),
        data.totalAmount.toFixed(2),
        doc.status,
        data.confirmedAt || ''
      ];
      rows.push(row.join(';'));
    }
  });

  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const filename = clientFilterName 
    ? `RSG_Gestudoc_Albaranes_${clientFilterName.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.csv`
    : `RSG_Gestudoc_Albaranes_Completo_${new Date().toISOString().substring(0, 10)}.csv`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
