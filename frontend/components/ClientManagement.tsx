import React, { useState } from 'react';
import { Client, AppDocument } from '../types';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit3, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Check, 
  X, 
  KeyRound, 
  ExternalLink, 
  ShieldCheck, 
  FileCheck, 
  Share2, 
  Copy, 
  Send, 
  MessageCircle, 
  AlertTriangle,
  LogIn,
  Trash2,
  ShieldAlert
} from 'lucide-react';

interface ClientManagementProps {
  clients: Client[];
  documents: AppDocument[];
  onUpdateClient: (updated: Client) => void;
  onAddClient: (newClient: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onImpersonateClient?: (client: Client) => void;
  onOpenContractModal?: (client: Client) => void;
  onTestLoginAsClient?: (client: Client) => void;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({
  clients,
  documents,
  onUpdateClient,
  onAddClient,
  onDeleteClient,
  onImpersonateClient,
  onOpenContractModal,
  onTestLoginAsClient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Estados del modal de doble confirmación para eliminar cliente
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2 | null>(null);
  const [typedVerificationName, setTypedVerificationName] = useState('');

  // Estado del modal para generar enlace de acceso al cliente
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedFullMessage, setCopiedFullMessage] = useState(false);

  // Formulario de edición
  const [editForm, setEditForm] = useState<Client | null>(null);

  // Formulario nuevo cliente
  const [newForm, setNewForm] = useState<Omit<Client, 'id' | 'createdAt'>>({
    internalCode: `CLI-0${clients.length + 1}`,
    commercialName: '',
    legalName: '',
    nif: '',
    contactPerson: '',
    email: '',
    phone: '',
    establishments: ['Principal'],
    status: 'ACTIVE',
    notes: '',
    accessId: `cliente${clients.length + 1}`,
    accessPassword: 'clave' + Math.floor(1000 + Math.random() * 9000)
  });

  const filteredClients = clients.filter(c => 
    c.commercialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nif.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.accessId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEdit = (client: Client) => {
    setEditForm({ ...client });
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm) {
      onUpdateClient(editForm);
      setSelectedClient(editForm);
      setIsEditing(false);
    }
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.commercialName || !newForm.nif) return;

    const created: Client = {
      ...newForm,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
      contract: {
        isSigned: false,
        contractVersion: 'RGPD-LOPDGDD-2025.1'
      }
    };
    onAddClient(created);
    setSelectedClient(created);
    setShowAddModal(false);
  };

  // Iniciar flujo de eliminación (Paso 1)
  const handleInitiateDelete = (client: Client) => {
    setClientToDelete(client);
    setDeleteStep(1);
    setTypedVerificationName('');
  };

  // Pasar al Paso 2 de confirmación definitiva
  const handleProceedToFinalDeleteStep = () => {
    setDeleteStep(2);
    setTypedVerificationName('');
  };

  // Ejecutar eliminación final
  const handleConfirmFinalDeletion = () => {
    if (!clientToDelete) return;
    const deletedId = clientToDelete.id;
    onDeleteClient(deletedId);

    // Cerrar modals
    setDeleteStep(null);
    setClientToDelete(null);
    setTypedVerificationName('');

    // Ajustar selección de cliente
    const remaining = clients.filter(c => c.id !== deletedId);
    setSelectedClient(remaining.length > 0 ? remaining[0] : null);
  };

  // Cancelar eliminación
  const handleCancelDelete = () => {
    setDeleteStep(null);
    setClientToDelete(null);
    setTypedVerificationName('');
  };

  // Construir el enlace directo al portal para el cliente
  const getClientDirectUrl = (client: Client) => {
    const baseUrl = window.location.href.split('#')[0];
    return `${baseUrl}#portal?user=${encodeURIComponent(client.accessId)}`;
  };

  // Mensaje estructurado de invitación para enviar al cliente
  const getInvitationMessage = (client: Client) => {
    const link = getClientDirectUrl(client);
    return `Hola ${client.commercialName},

Te facilitamos el enlace directo para acceder a tu Portal Privado de RSG Gestudoc y enviar tus albaranes y facturas:

🔗 Enlace de acceso:
${link}

👤 Tu Identificador / Usuario: ${client.accessId}
🔑 Tu Contraseña privada: ${client.accessPassword}

(Al hacer clic en el enlace se abrirá la pantalla de acceso donde deberás introducir tu ID y contraseña para entrar de forma segura a tu espacio).

RSG Gestudoc — Gestiona tus documentos`;
  };

  const handleCopyLinkOnly = (client: Client) => {
    navigator.clipboard.writeText(getClientDirectUrl(client));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyFullMessage = (client: Client) => {
    navigator.clipboard.writeText(getInvitationMessage(client));
    setCopiedFullMessage(true);
    setTimeout(() => setCopiedFullMessage(false), 3000);
  };

  const handleSendWhatsApp = (client: Client) => {
    const msg = encodeURIComponent(getInvitationMessage(client));
    const phoneClean = (client.phone || '').replace(/\D/g, '');
    const waUrl = phoneClean 
      ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${msg}`
      : `https://api.whatsapp.com/send?text=${msg}`;
    window.open(waUrl, '_blank');
  };

  const handleSendEmail = (client: Client) => {
    const subject = encodeURIComponent(`Acceso a tu portal de albaranes — ${client.commercialName}`);
    const body = encodeURIComponent(getInvitationMessage(client));
    window.location.href = `mailto:${client.email || ''}?subject=${subject}&body=${body}`;
  };

  const clientDocs = selectedClient 
    ? documents.filter(d => d.clientId === selectedClient.id) 
    : [];

  return (
    <div className="space-y-6">
      {/* Cabecera con estadísticas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Gestión de Clientes ({clients.length} activo{clients.length === 1 ? '' : 's'})
          </h1>
          <p className="text-xs text-slate-500">
            Control de empresas autorizadas, generación de enlaces directos de acceso, contratos RGPD y bajas protegidas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Nuevo Cliente</span>
        </button>
      </div>

      {/* Contenedor Split: Lista a la izquierda, detalle a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de clientes */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[700px]">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, CIF o usuario..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No se encontraron clientes registrados.
              </div>
            ) : (
              filteredClients.map(client => {
                const isSelected = selectedClient?.id === client.id;
                const count = documents.filter(d => d.clientId === client.id).length;

                return (
                  <div
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client);
                      setIsEditing(false);
                    }}
                    className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{client.commercialName}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {client.internalCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-[220px]">
                        {client.legalName} • ID: <span className="font-mono text-indigo-600">{client.accessId}</span>
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        {client.contract?.isSigned ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Contrato RGPD Firmado
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium">
                            Contrato Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {count} docs
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detalle del cliente */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          {selectedClient ? (
            <>
              {isEditing && editForm ? (
                /* Formulario de edición */
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h2 className="text-base font-bold text-slate-900">Editar Ficha de Cliente</h2>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1 text-xs border rounded-lg hover:bg-slate-50 text-slate-600"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-semibold"
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Nombre Comercial</label>
                      <input
                        type="text"
                        value={editForm.commercialName}
                        onChange={e => setEditForm({ ...editForm, commercialName: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Razón Social</label>
                      <input
                        type="text"
                        value={editForm.legalName}
                        onChange={e => setEditForm({ ...editForm, legalName: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">NIF / CIF</label>
                      <input
                        type="text"
                        value={editForm.nif}
                        onChange={e => setEditForm({ ...editForm, nif: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Persona de Contacto</label>
                      <input
                        type="text"
                        value={editForm.contactPerson}
                        onChange={e => setEditForm({ ...editForm, contactPerson: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>

                    {/* Credenciales de Acceso */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl col-span-2 space-y-2">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                        Credenciales de Acceso Privadas
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Usuario / ID de acceso</label>
                          <input
                            type="text"
                            value={editForm.accessId}
                            onChange={e => setEditForm({ ...editForm, accessId: e.target.value })}
                            className="w-full p-2 border rounded-lg font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Contraseña</label>
                          <input
                            type="text"
                            value={editForm.accessPassword}
                            onChange={e => setEditForm({ ...editForm, accessPassword: e.target.value })}
                            className="w-full p-2 border rounded-lg font-mono font-semibold"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-slate-600 font-medium mb-1">
                        Establecimientos (separados por coma)
                      </label>
                      <input
                        type="text"
                        value={editForm.establishments.join(', ')}
                        onChange={e => setEditForm({
                          ...editForm,
                          establishments: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-600 font-medium mb-1">Observaciones Internas</label>
                      <textarea
                        value={editForm.notes || ''}
                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                        className="w-full p-2 border rounded-lg h-16"
                      />
                    </div>
                  </div>
                </form>
              ) : (
                /* Vista de solo lectura */
                <>
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900">{selectedClient.commercialName}</h2>
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                          {selectedClient.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedClient.legalName} • NIF: <strong className="text-slate-700">{selectedClient.nif}</strong>
                      </p>
                    </div>

                    {/* Botonera de acciones superiores */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Botón GENERAR ENLACE CLIENTE */}
                      <button
                        type="button"
                        onClick={() => setShowShareModal(true)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                        title="Generar enlace directo para enviar al cliente por WhatsApp o Email"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Generar Enlace Cliente</span>
                      </button>

                      {/* Botón PROBAR COMO CLIENTE */}
                      {onTestLoginAsClient && (
                        <button
                          type="button"
                          onClick={() => onTestLoginAsClient(selectedClient)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                          title="Probar acceso real como cliente introduciendo ID y contraseña"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Probar como cliente</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => startEdit(selectedClient)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {/* BOTÓN ELIMINAR CLIENTE (Con doble confirmación) */}
                      <button
                        type="button"
                        onClick={() => handleInitiateDelete(selectedClient)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                        title="Eliminar este cliente del sistema con doble confirmación de seguridad"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>

                  {/* Tarjeta de Acceso y Enlace Rápido para el Cliente */}
                  <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-md border border-indigo-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-xs text-white">Credenciales y Acceso al Portal Cliente</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                        Acceso con ID + Contraseña
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Identificador de Usuario:</span>
                        <span className="font-mono font-bold text-white text-sm">{selectedClient.accessId}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Contraseña Privada:</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">{selectedClient.accessPassword}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                      <p className="text-[11px] text-slate-300">
                        Para entrar, el cliente debe introducir su usuario y contraseña en el portal.
                      </p>
                      <div className="flex items-center gap-3">
                        {onTestLoginAsClient && (
                          <button
                            type="button"
                            onClick={() => onTestLoginAsClient(selectedClient)}
                            className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2.5 py-1 rounded transition-colors flex items-center gap-1"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Probar ahora</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowShareModal(true)}
                          className="text-xs text-emerald-300 hover:text-emerald-200 font-bold underline flex items-center gap-1 shrink-0"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Mandar enlace &rarr;</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta de Contrato Legal RGPD y Confidencialidad */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${selectedClient.contract?.isSigned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">
                          Contrato RGPD & Secreto Comercial (Art. 28)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {selectedClient.contract?.isSigned
                            ? `Firmado por ${selectedClient.contract.signedBy} el ${selectedClient.contract.signedAt}`
                            : 'Pendiente de formalizar firma con el cliente'}
                        </p>
                      </div>
                    </div>

                    {onOpenContractModal && (
                      <button
                        type="button"
                        onClick={() => onOpenContractModal(selectedClient)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold flex items-center gap-1"
                      >
                        <span>{selectedClient.contract?.isSigned ? 'Ver / Imprimir Contrato' : 'Firmar Contrato'}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                      <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">Contacto</span>
                      <div className="space-y-1.5 text-slate-600">
                        <p className="font-medium text-slate-900">{selectedClient.contactPerson}</p>
                        <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedClient.email}</p>
                        <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedClient.phone}</p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                      <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">Establecimientos</span>
                      <div className="space-y-1 text-slate-600">
                        {selectedClient.establishments.map((est, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{est}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Documentos asociados */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-slate-500" />
                        Albaranes del Cliente ({clientDocs.length})
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Custodiados con trazabilidad
                      </span>
                    </div>

                    {clientDocs.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 italic">No hay documentos cargados para este cliente aún.</p>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {clientDocs.map(doc => (
                          <div key={doc.id} className="p-2.5 text-xs flex items-center justify-between hover:bg-slate-50">
                            <div>
                              <p className="font-medium text-slate-800">{doc.originalFilename}</p>
                              <p className="text-[11px] text-slate-400">
                                {doc.uploadedAt} • Total: {(doc.deliveryNoteData?.totalAmount || 0).toFixed(2)} €
                              </p>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              doc.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {doc.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs">
              {clients.length === 0 
                ? 'No hay clientes registrados en la plataforma. Pulsa en "Añadir Nuevo Cliente" para comenzar.' 
                : 'Selecciona un cliente del listado para ver su información.'}
            </div>
          )}
        </div>
      </div>

      {/* MODAL PASO 1 DE CONFIRMACIÓN PARA ELIMINAR CLIENTE */}
      {deleteStep === 1 && clientToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-200 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="p-3 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">1ª Confirmación: Eliminar Cliente</h3>
                <p className="text-xs text-rose-700">Acción crítica irreversible</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2 text-rose-950">
              <p>
                ¿Deseas dar de baja a <strong className="text-slate-900">{clientToDelete.commercialName}</strong> ({clientToDelete.internalCode} - CIF: {clientToDelete.nif})?
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-900">
                <li>Se revocará el acceso de su identificador <strong>{clientToDelete.accessId}</strong> al portal cliente.</li>
                <li>Se eliminarán sus establecimientos y la vinculación de su contrato.</li>
                <li>Actualmente tiene <strong>{documents.filter(d => d.clientId === clientToDelete.id).length}</strong> documento(s) asociados en el sistema.</li>
              </ul>
            </div>

            <p className="text-xs text-slate-600">
              Esta operación requiere una segunda confirmación de seguridad para evitar eliminaciones accidentales.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProceedToFinalDeleteStep}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center gap-1.5"
              >
                <span>Continuar a confirmación definitiva &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PASO 2 DE CONFIRMACIÓN DEFINITIVA PARA ELIMINAR CLIENTE */}
      {deleteStep === 2 && clientToDelete && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-600 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-800">
              <div className="p-3 bg-rose-100 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-rose-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">2ª Confirmación Definitiva</h3>
                <p className="text-xs text-rose-700 font-semibold">Confirmación obligatoria requerida</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Para confirmar la eliminación definitiva de <strong>{clientToDelete.commercialName}</strong>, escribe el código interno <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-rose-700 font-bold">{clientToDelete.internalCode}</span> a continuación:
            </p>

            <div>
              <input
                type="text"
                value={typedVerificationName}
                onChange={e => setTypedVerificationName(e.target.value)}
                placeholder={`Escribe ${clientToDelete.internalCode} aquí`}
                className="w-full p-2.5 border-2 border-rose-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-rose-600 text-slate-900"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Atrás / Cancelar
              </button>
              <button
                type="button"
                disabled={typedVerificationName.trim().toUpperCase() !== clientToDelete.internalCode.trim().toUpperCase()}
                onClick={handleConfirmFinalDeletion}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 ${
                  typedVerificationName.trim().toUpperCase() === clientToDelete.internalCode.trim().toUpperCase()
                    ? 'bg-rose-700 hover:bg-rose-600 text-white cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Cliente Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GENERADOR DE ENLACE DE ACCESO PARA EL CLIENTE */}
      {showShareModal && selectedClient && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Enlace de Acceso para el Cliente</h3>
                  <p className="text-xs text-slate-500">{selectedClient.commercialName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AVISO IMPORTANTE: No utilices el enlace blob del navegador */}
            <div className="p-3.5 bg-amber-50 border-2 border-amber-400 text-amber-950 rounded-xl text-xs flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-bold text-amber-900 block">
                  Indicación para enviar el enlace al cliente:
                </strong>
                <p className="text-amber-800 leading-relaxed font-medium">
                  "No utilices el enlace blob del navegador. Haz clic en el botón <strong>'Copiar'</strong> (junto al enlace directo) o en <strong>'Copiar Todo el Mensaje'</strong> para extraer la información real y luego pégala en el mensaje que vas a enviar."
                </p>
                <p className="text-[11px] text-amber-700">
                  Para entrar a su espacio, el cliente deberá introducir obligatoriamente su identificador (<strong>{selectedClient.accessId}</strong>) y su contraseña privada.
                </p>
              </div>
            </div>

            {/* Enlace directo con botón Copiar */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Enlace Directo del Portal:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getClientDirectUrl(selectedClient)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-indigo-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLinkOnly(selectedClient)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0 shadow-sm ${
                    copiedLink ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                  title="Copiar enlace real"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Mensaje formateado para WhatsApp / Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Mensaje con Credenciales para Enviar:</label>
              <textarea
                readOnly
                rows={6}
                value={getInvitationMessage(selectedClient)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-sans leading-relaxed resize-none"
              />
            </div>

            {/* Botón destacado: Probar ahora como cliente */}
            {onTestLoginAsClient && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-950 block">¿Quieres probar el acceso ahora?</span>
                  <p className="text-[11px] text-emerald-800">
                    Abre la pantalla de inicio de sesión con el identificador ({selectedClient.accessId}) precargado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowShareModal(false);
                    onTestLoginAsClient(selectedClient);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Probar como cliente</span>
                </button>
              </div>
            )}

            {/* Botonera de acciones rápidas de envío */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleCopyFullMessage(selectedClient)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                  copiedFullMessage 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedFullMessage ? '¡Mensaje Copiado!' : 'Copiar Todo el Mensaje'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(selectedClient)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Mandar por WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendEmail(selectedClient)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Mandar por Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alta de Cliente */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Alta de Nuevo Cliente</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Código Interno</label>
                  <input
                    type="text"
                    value={newForm.internalCode}
                    onChange={e => setNewForm({ ...newForm, internalCode: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">NIF / CIF *</label>
                  <input
                    type="text"
                    value={newForm.nif}
                    onChange={e => setNewForm({ ...newForm, nif: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="B12345678"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Nombre Comercial *</label>
                <input
                  type="text"
                  value={newForm.commercialName}
                  onChange={e => setNewForm({ ...newForm, commercialName: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Ej: Cafetería Central"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <span className="font-bold text-amber-900 block text-[11px]">Credenciales de Acceso Privadas:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-0.5">Usuario de acceso:</label>
                    <input
                      type="text"
                      value={newForm.accessId}
                      onChange={e => setNewForm({ ...newForm, accessId: e.target.value })}
                      className="w-full p-1.5 border rounded-lg font-mono bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Contraseña:</label>
                    <input
                      type="text"
                      value={newForm.accessPassword}
                      onChange={e => setNewForm({ ...newForm, accessPassword: e.target.value })}
                      className="w-full p-1.5 border rounded-lg font-mono bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Persona de Contacto</label>
                  <input
                    type="text"
                    value={newForm.contactPerson}
                    onChange={e => setNewForm({ ...newForm, contactPerson: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newForm.phone}
                    onChange={e => setNewForm({ ...newForm, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={newForm.email}
                  onChange={e => setNewForm({ ...newForm, email: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Crear Ficha de Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
