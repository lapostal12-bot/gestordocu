import React, { useState } from 'react';
import { AppDocument, Client, DocumentStatus, DocumentCategory } from '../types';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Download,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import { generateDeliveryNotesExcelTemplate, exportDocumentsToExcelTemplate } from '../services/excelExportService';

interface DocumentListProps {
  documents: AppDocument[];
  clients: Client[];
  onOpenReview: (doc: AppDocument) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  clients,
  onOpenReview
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDocType, setSelectedDocType] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Proveedores únicos para filtro
  const suppliers = Array.from(new Set(
    documents
      .map(d => d.deliveryNoteData?.supplierName)
      .filter((s): s is string => Boolean(s))
  ));
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.originalFilename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.deliveryNoteData?.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.deliveryNoteData?.documentNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedClientId !== 'ALL' && doc.clientId !== selectedClientId) return false;
    if (selectedStatus !== 'ALL' && doc.status !== selectedStatus) return false;
    if (selectedDocType !== 'ALL' && doc.docType !== selectedDocType) return false;
    if (selectedSupplier !== 'ALL' && doc.deliveryNoteData?.supplierName !== selectedSupplier) return false;
    if (dateFrom && doc.uploadedAt.substring(0, 10) < dateFrom) return false;
    if (dateTo && doc.uploadedAt.substring(0, 10) > dateTo) return false;

    return true;
  });

  const handleExportFiltered = () => {
    const clientName = selectedClientId !== 'ALL' ? clients.find(c => c.id === selectedClientId)?.commercialName : undefined;
    exportDocumentsToExcelTemplate(filteredDocs, clientName);
  };

  return (
    <div className="space-y-4">
      {/* Cabecera con botones de exportación a Excel y descarga de plantilla */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Repositorio de Albaranes & Documentos
          </h1>
          <p className="text-xs text-slate-500">
            Filtra, revisa albaranes y descarga los datos a Excel según la plantilla contable oficial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={generateDeliveryNotesExcelTemplate}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Descargar la plantilla de Excel vacía con ejemplos"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Descargar Plantilla Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportFiltered}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center gap-1.5"
            title="Descargar los albaranes actuales en formato plantilla Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Selección a Excel ({filteredDocs.length})</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar archivo, proveedor, nº..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="ALL">Todos los clientes</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.commercialName}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDING_REVIEW">Pendiente de Revisión</option>
              <option value="CONFIRMED">Confirmado / Validado</option>
              <option value="RECEIVED">Recibido (Sin procesar)</option>
              <option value="ERROR">Con Incidencia</option>
            </select>
          </div>

          <div>
            <select
              value={selectedSupplier}
              onChange={e => setSelectedSupplier(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="ALL">Todos los proveedores</option>
              {suppliers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5" /> Periodo:
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
            />
            <span className="text-slate-400">hasta</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
            />
          </div>

          {(searchTerm || selectedClientId !== 'ALL' || selectedStatus !== 'ALL' || selectedSupplier !== 'ALL' || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedClientId('ALL');
                setSelectedStatus('ALL');
                setSelectedSupplier('ALL');
                setDateFrom('');
                setDateTo('');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Documentos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Documento / Archivo</th>
                <th className="py-3 px-4">Cliente / Local</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4">Nº Albarán</th>
                <th className="py-3 px-4 text-right">Base / IVA</th>
                <th className="py-3 px-4 text-right">Total Albarán</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se encontraron documentos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => {
                  const data = doc.deliveryNoteData;
                  const isDiscrepant = doc.hasDiscrepancy || data?.calculationDiscrepancy;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 truncate max-w-[200px]" title={doc.originalFilename}>
                          {doc.originalFilename}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {doc.uploadedAt} • {(doc.fileSize / 1024).toFixed(0)} KB
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{doc.clientName}</div>
                        <div className="text-[11px] text-slate-400">{doc.establishment || 'Sede Principal'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">
                          {data?.supplierName || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {data?.supplierNif || ''}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {data?.documentNumber || 'Pendiente'}
                        </span>
                      </td>

                      {/* Base e IVA desglosados */}
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-600">
                        {data?.subtotal ? (
                          <div>
                            <div>Base: {data.subtotal.toFixed(2)} €</div>
                            <div className="text-indigo-600">IVA: {data.vatAmount.toFixed(2)} €</div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Total albarán y aviso rojo de discrepancia */}
                      <td className="py-3 px-4 text-right">
                        {data?.totalAmount ? (
                          <div className="font-bold text-slate-900 font-mono text-sm">
                            {data.totalAmount.toFixed(2)} €
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {isDiscrepant && (
                          <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded inline-block mt-0.5">
                            Discrepancia
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {doc.status === 'CONFIRMED' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmado
                          </span>
                        ) : doc.status === 'PENDING_REVIEW' ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                            <Clock className="w-3 h-3 text-amber-600" /> Pendiente
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px]">
                            {doc.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenReview(doc)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Revisar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
