import React, { useState } from 'react';
import { AppDocument, Client } from '../types';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Printer, 
  TrendingUp, 
  FileSpreadsheet,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { generateDeliveryNotesExcelTemplate, exportDocumentsToExcelTemplate } from '../services/excelExportService';

interface ReportsViewProps {
  documents: AppDocument[];
  clients: Client[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ documents, clients }) => {
  const [reportType, setReportType] = useState<string>('BY_SUPPLIER');
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('2025-01-01');
  const [dateTo, setDateTo] = useState<string>('2025-12-31');

  // Solo albaranes confirmados para informes fiables
  const confirmedDocs = documents.filter(d => {
    if (d.status !== 'CONFIRMED' || !d.deliveryNoteData) return false;
    if (selectedClientId !== 'ALL' && d.clientId !== selectedClientId) return false;
    const docDate = d.deliveryNoteData.documentDate;
    if (dateFrom && docDate < dateFrom) return false;
    if (dateTo && docDate > dateTo) return false;
    return true;
  });

  // 1. Datos para Compras por Proveedor
  const supplierSpendMap = new Map<string, number>();
  confirmedDocs.forEach(d => {
    const sName = d.deliveryNoteData?.supplierName || 'Otros';
    supplierSpendMap.set(sName, (supplierSpendMap.get(sName) || 0) + d.deliveryNoteData!.totalAmount);
  });
  const supplierData = Array.from(supplierSpendMap.entries()).map(([name, total]) => ({
    name: name.length > 18 ? name.substring(0, 16) + '...' : name,
    total: Number(total.toFixed(2))
  })).sort((a, b) => b.total - a.total);

  // 2. Datos para Compras por Producto
  const productSpendMap = new Map<string, { total: number; qty: number; unit: string }>();
  confirmedDocs.forEach(d => {
    d.deliveryNoteData!.items.forEach(item => {
      const pName = item.normalizedProduct;
      const current = productSpendMap.get(pName) || { total: 0, qty: 0, unit: item.unit };
      current.total += item.lineTotal;
      current.qty += item.quantity;
      productSpendMap.set(pName, current);
    });
  });
  const productData = Array.from(productSpendMap.entries()).map(([name, val]) => ({
    name: name.length > 18 ? name.substring(0, 16) + '...' : name,
    total: Number(val.total.toFixed(2)),
    cantidad: Number(val.qty.toFixed(1)),
    unidad: val.unit
  })).sort((a, b) => b.total - a.total);

  // Exportar usando la plantilla oficial contable
  const exportOfficialExcel = () => {
    const clientName = selectedClientId !== 'ALL' ? clients.find(c => c.id === selectedClientId)?.commercialName : undefined;
    exportDocumentsToExcelTemplate(confirmedDocs, clientName);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Informes Oficiales de Compras — RSG Gestudoc
          </h1>
          <p className="text-xs text-slate-500">
            Descarga de datos de albaranes en formato plantilla Excel compatible con sistemas ERP y contabilidad.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={generateDeliveryNotesExcelTemplate}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            title="Descargar fichero con el formato de plantilla Excel"
          >
            <Download className="w-4 h-4" />
            <span>Mandar Plantilla Excel</span>
          </button>

          <button
            type="button"
            onClick={exportOfficialExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Descargar Datos a Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Selector de filtros y periodo DESDE - HASTA */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Tipo de Informe</label>
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
          >
            <option value="BY_SUPPLIER">Compras por Proveedor</option>
            <option value="BY_PRODUCT">Compras por Producto</option>
            <option value="QTY_PRODUCT">Cantidades Compradas</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Cliente</label>
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
          >
            <option value="ALL">Todos los clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.commercialName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Fecha DESDE</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Fecha HASTA</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* Gráfico y Desglose */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {reportType === 'BY_SUPPLIER' && 'Volumen Total de Compras por Proveedor'}
              {reportType === 'BY_PRODUCT' && 'Distribución de Gasto por Producto'}
              {reportType === 'QTY_PRODUCT' && 'Unidades Físicas Compradas'}
            </h2>
            <p className="text-xs text-slate-500">
              Periodo activo: {dateFrom} a {dateTo} • {confirmedDocs.length} albaranes confirmados computados
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Total acumulado en selección:</span>
            <div className="text-lg font-bold text-indigo-700 font-mono">
              {confirmedDocs.reduce((a, b) => a + (b.deliveryNoteData?.totalAmount || 0), 0).toFixed(2)} €
            </div>
          </div>
        </div>

        {/* Gráfico Recharts */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={reportType === 'BY_SUPPLIER' ? supplierData : productData} 
              margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip 
                formatter={(val: any) => [`${val} ${reportType === 'QTY_PRODUCT' ? 'uds' : '€'}`, 'Valor']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Bar 
                dataKey={reportType === 'QTY_PRODUCT' ? 'cantidad' : 'total'} 
                fill="#4f46e5" 
                radius={[6, 6, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla estructurada del informe */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Concepto</th>
                {reportType !== 'BY_SUPPLIER' && <th className="py-3 px-4 text-center">Unidad</th>}
                {reportType !== 'BY_SUPPLIER' && <th className="py-3 px-4 text-right">Cantidad</th>}
                <th className="py-3 px-4 text-right">Importe Total (€)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(reportType === 'BY_SUPPLIER' ? supplierData : productData).map((row: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{row.name}</td>
                  {reportType !== 'BY_SUPPLIER' && (
                    <td className="py-2.5 px-4 text-center text-slate-500 font-mono">{row.unidad}</td>
                  )}
                  {reportType !== 'BY_SUPPLIER' && (
                    <td className="py-2.5 px-4 text-right font-medium text-slate-700">{row.cantidad}</td>
                  )}
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    {row.total?.toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
