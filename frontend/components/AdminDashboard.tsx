import React from 'react';
import { AppDocument, Client } from '../types';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

interface AdminDashboardProps {
  documents: AppDocument[];
  clients: Client[];
  onOpenReview: (doc: AppDocument) => void;
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  documents,
  clients,
  onOpenReview,
  onNavigateTab
}) => {
  const totalDocs = documents.length;
  const pendingDocs = documents.filter(d => d.status === 'PENDING_REVIEW');
  const confirmedDocs = documents.filter(d => d.status === 'CONFIRMED');
  const discrepancyDocs = documents.filter(d => d.hasDiscrepancy || d.deliveryNoteData?.calculationDiscrepancy);

  // Compras totales confirmadas
  const totalSpendConfirmed = confirmedDocs.reduce((acc, doc) => {
    return acc + (doc.deliveryNoteData?.totalAmount || 0);
  }, 0);

  // Gráfica de actividad por cliente
  const clientActivityData = clients.slice(0, 7).map(c => {
    const count = documents.filter(d => d.clientId === c.id).length;
    return {
      name: c.commercialName.length > 14 ? c.commercialName.substring(0, 12) + '...' : c.commercialName,
      documentos: count
    };
  });

  return (
    <div className="space-y-6">
      {/* Bienvenida y resumen ejecutivo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-lg border border-indigo-900/40">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Panel de Control Central
            <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-medium px-2.5 py-0.5 rounded-full">
              Oficina Propietario
            </span>
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Recepción activa para {clients.length} clientes. El OCR asistido extrae albaranes mientras tú mantienes el control de confirmación.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('documents')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <span>Ver todos los documentos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Documentos Recibidos</span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalDocs}</span>
            <span className="text-xs text-slate-500">en plataforma</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>20 clientes habilitados</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pendientes de Revisión</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-900">{pendingDocs.length}</span>
            <span className="text-xs text-amber-700 font-medium">albaranes</span>
          </div>
          <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Requieren validación humana</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Discrepancias Cálculo</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-900">{discrepancyDocs.length}</span>
            <span className="text-xs text-rose-700 font-medium">alertas</span>
          </div>
          <div className="mt-2 text-xs text-rose-600 flex items-center gap-1">
            <span>Diferencia en sumatorios o IVA</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Compras Validadas</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-900">
              {totalSpendConfirmed.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{confirmedDocs.length} albaranes cerrados</span>
          </div>
        </div>
      </div>

      {/* Grid Central: Lista de Acción Urgente & Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Albaranes que requieren revisión */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Albaranes Pendientes de Confirmación
              </h2>
              <p className="text-xs text-slate-500">
                La IA ha digitalizado las líneas. Pulsa para verificar con el original y confirmar.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {pendingDocs.length} pendiente(s)
            </span>
          </div>

          {pendingDocs.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">¡Al día! No hay albaranes pendientes.</p>
              <p className="text-xs text-slate-400">Todos los documentos recibidos han sido revisados y confirmados.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingDocs.map(doc => (
                <div key={doc.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {doc.deliveryNoteData?.supplierName || 'Proveedor por verificar'}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {doc.deliveryNoteData?.documentNumber || 'S/N'}
                      </span>
                      {doc.hasDiscrepancy && (
                        <span className="text-[10px] bg-rose-100 text-rose-700 font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Discrepancia
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Cliente: <strong className="text-slate-700">{doc.clientName}</strong></span>
                      <span>•</span>
                      <span>Fecha doc: {doc.deliveryNoteData?.documentDate || 'N/D'}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-900">
                        {(doc.deliveryNoteData?.totalAmount || 0).toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenReview(doc)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5"
                  >
                    <span>Revisar albarán</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Recepción por Cliente */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              Documentos por Cliente
            </h2>
            <p className="text-xs text-slate-500">Muestra de volumen de envíos recientes.</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="documentos" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Total clientes: 20</span>
            <button
              type="button"
              onClick={() => onNavigateTab('clients')}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Gestionar empresas &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
