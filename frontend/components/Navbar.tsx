import React from 'react';
import { UserRole, Client } from '../types';
import { 
  Building2, 
  FileText, 
  ShieldCheck, 
  Users, 
  Layers, 
  BarChart3, 
  Settings, 
  UploadCloud, 
  ChevronDown, 
  Sparkles, 
  LogOut, 
  FileSpreadsheet, 
  FileCheck,
  LogIn
} from 'lucide-react';
import { generateDeliveryNotesExcelTemplate } from '../services/excelExportService';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  clients: Client[];
  selectedClientId: string;
  onSelectClient: (id: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingReviewsCount: number;
  authenticatedClient: Client | null;
  onClientLogout: () => void;
  onOpenContractModal?: () => void;
  onTestClientMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  clients,
  selectedClientId,
  onSelectClient,
  activeTab,
  onTabChange,
  pendingReviewsCount,
  authenticatedClient,
  onClientLogout,
  onOpenContractModal,
  onTestClientMode
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Bar: Selector de Entorno & Rol */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  RSG Gestudoc
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 hidden sm:inline">
                  Gestiona tus documentos
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Digitalización, OCR Inteligente & Custodia Legal
              </p>
            </div>
          </div>

          {/* Switcher de Perfil: Administrador Propietario vs Cliente */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Botón descarga plantilla Excel rápida */}
            <button
              type="button"
              onClick={generateDeliveryNotesExcelTemplate}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              title="Descargar plantilla Excel oficial de albaranes"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Plantilla Excel</span>
            </button>

            {/* Selector de Rol */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => onRoleChange('ADMIN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  currentRole === 'ADMIN'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Panel Oficina</span>
              </button>
              <button
                type="button"
                onClick={() => onRoleChange('CLIENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  currentRole === 'CLIENT'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Portal Cliente</span>
              </button>
            </div>

            {/* Botón directo 'Probar como cliente' visible en Oficina */}
            {currentRole === 'ADMIN' && onTestClientMode && (
              <button
                type="button"
                onClick={onTestClientMode}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all"
                title="Probar pantalla de acceso y portal como cliente de prueba"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>Probar como cliente</span>
              </button>
            )}

            {/* Desplegable de selección de clientes para OFICINA */}
            {currentRole === 'ADMIN' && (
              <div className="relative hidden xl:block">
                <select
                  value={selectedClientId}
                  onChange={(e) => onSelectClient(e.target.value)}
                  className="bg-slate-800 text-indigo-300 text-xs font-medium rounded-lg px-3 py-2 pr-7 border border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer max-w-[190px] truncate"
                  title="Filtro de restaurante para Oficina"
                >
                  <option value="" disabled>Seleccionar Cliente</option>
                  {clients.map(cli => (
                    <option key={cli.id} value={cli.id} className="bg-slate-900 text-white">
                      🏢 {cli.commercialName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-indigo-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            )}

            {/* Botón Salir en Portal Cliente */}
            {currentRole === 'CLIENT' && authenticatedClient && (
              <button
                type="button"
                onClick={onClientLogout}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Cerrar sesión del cliente"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navegación por pestañas del Panel de Oficina */}
      {currentRole === 'ADMIN' && (
        <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
            {[
              { id: 'dashboard', label: 'Inicio', icon: Layers },
              { id: 'clients', label: `Clientes (${clients.length})`, icon: Building2 },
              { id: 'documents', label: 'Documentos', icon: FileText, badge: pendingReviewsCount > 0 ? pendingReviewsCount : null },
              { id: 'catalog', label: 'Productos & Proveedores', icon: Users },
              { id: 'reports', label: 'Informes & Excel', icon: BarChart3 },
              { id: 'config', label: 'Seguridad & Contrato RGPD', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded-full text-[10px]">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Banner identificativo cuando está en Portal Cliente autenticado */}
      {currentRole === 'CLIENT' && authenticatedClient && (
        <div className="bg-emerald-950/50 border-t border-emerald-800/40 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Espacio Privado: <strong className="text-white">{authenticatedClient.commercialName}</strong> ({authenticatedClient.nif})</span>
            </div>
            <div className="flex items-center gap-3">
              {onOpenContractModal && (
                <button
                  type="button"
                  onClick={onOpenContractModal}
                  className="text-emerald-300 hover:text-white underline flex items-center gap-1 text-[11px]"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Ver Contrato de Confidencialidad</span>
                </button>
              )}
              <span className="text-slate-400 text-[11px] hidden md:inline">
                Establecimientos: {authenticatedClient.establishments.join(', ')}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
