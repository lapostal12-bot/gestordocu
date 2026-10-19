import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  Client, 
  AppDocument, 
  ClassificationRule, 
  AuditEntry 
} from './types';
import { 
  getStoredClients, 
  saveStoredClients, 
  getStoredDocuments, 
  saveStoredDocuments, 
  getStoredRules, 
  saveStoredRules, 
  getStoredAudit, 
  addAuditLog 
} from './services/storageService';
import { processDocumentWithGemini } from './services/geminiOcrService';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { ClientManagement } from './components/ClientManagement';
import { DocumentList } from './components/DocumentList';
import { DeliveryNoteReviewModal } from './components/DeliveryNoteReviewModal';
import { ProductsAndSuppliers } from './components/ProductsAndSuppliers';
import { ReportsView } from './components/ReportsView';
import { AuditAndConfig } from './components/AuditAndConfig';
import { ClientPortal } from './components/ClientPortal';
import { ClientLogin } from './components/ClientLogin';
import { LegalContractModal } from './components/LegalContractModal';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [rules, setRules] = useState<ClassificationRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);

  // Navegación en Oficina
  const [activeAdminTab, setActiveAdminTab] = useState<string>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string>('cli-001');

  // Sesión privada en Portal Cliente (requiere autenticación con ID y Contraseña)
  const [authenticatedClient, setAuthenticatedClient] = useState<Client | null>(null);
  const [prefilledUserFromUrl, setPrefilledUserFromUrl] = useState<string>('fogon');

  // Modal de revisión de albarán
  const [reviewingDoc, setReviewingDoc] = useState<AppDocument | null>(null);

  // Modal de Contrato Legal
  const [contractModalClient, setContractModalClient] = useState<Client | null>(null);

  // Inicialización y detección de enlace compartido con hash (#portal?user=...)
  useEffect(() => {
    const loadedClients = getStoredClients();
    const loadedDocs = getStoredDocuments();
    const loadedRules = getStoredRules();
    const loadedAudit = getStoredAudit();

    setClients(loadedClients);
    setDocuments(loadedDocs);
    setRules(loadedRules);
    setAuditLogs(loadedAudit);
    if (loadedClients.length > 0) {
      setSelectedClientId(loadedClients[0].id);
      setPrefilledUserFromUrl(loadedClients[0].accessId);
    }

    // Comprobar si el cliente abrió la web con un enlace directo
    const handleUrlHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#portal') || hash.startsWith('#cliente')) {
        setCurrentRole('CLIENT');
        const queryPart = hash.includes('?') ? hash.split('?')[1] : '';
        const params = new URLSearchParams(queryPart);
        const userParam = params.get('user') || params.get('id') || '';
        if (userParam) {
          setPrefilledUserFromUrl(userParam);
        }
      }
    };

    handleUrlHash();
    window.addEventListener('hashchange', handleUrlHash);
    return () => window.removeEventListener('hashchange', handleUrlHash);
  }, []);

  // Actualizar clientes
  const handleUpdateClient = (updated: Client) => {
    const next = clients.map(c => c.id === updated.id ? updated : c);
    setClients(next);
    saveStoredClients(next);
    addAuditLog({
      user: 'Admin Oficina RSG',
      action: 'MODIFICACION_CLIENTE',
      details: `Ficha del cliente ${updated.commercialName} (${updated.internalCode}) actualizada.`
    });
    setAuditLogs(getStoredAudit());

    if (authenticatedClient && authenticatedClient.id === updated.id) {
      setAuthenticatedClient(updated);
    }
  };

  const handleAddClient = (newClient: Client) => {
    const next = [...clients, newClient];
    setClients(next);
    saveStoredClients(next);
    addAuditLog({
      user: 'Admin Oficina RSG',
      action: 'ALTA_CLIENTE',
      details: `Cliente ${newClient.commercialName} creado con éxito en RSG Gestudoc.`
    });
    setAuditLogs(getStoredAudit());
  };

  // Eliminar cliente (con doble confirmación desde ClientManagement)
  const handleDeleteClient = (clientId: string) => {
    const clientToDelete = clients.find(c => c.id === clientId);
    const clientName = clientToDelete ? clientToDelete.commercialName : clientId;
    const clientCode = clientToDelete ? clientToDelete.internalCode : '';

    // Filtrar clientes
    const nextClients = clients.filter(c => c.id !== clientId);
    setClients(nextClients);
    saveStoredClients(nextClients);

    // Si el cliente seleccionado en la oficina era este, cambiar la selección
    if (selectedClientId === clientId) {
      setSelectedClientId(nextClients.length > 0 ? nextClients[0].id : '');
    }

    // Si el cliente logueado era este, cerrar su sesión
    if (authenticatedClient && authenticatedClient.id === clientId) {
      setAuthenticatedClient(null);
    }

    addAuditLog({
      user: 'Admin Oficina RSG',
      action: 'ELIMINACION_CLIENTE',
      details: `Cliente "${clientName}" (${clientCode}) eliminado definitivamente del sistema.`
    });
    setAuditLogs(getStoredAudit());
  };

  // Guardar documento tras revisión humana y confirmación
  const handleSaveAndConfirmDocument = (confirmedDoc: AppDocument) => {
    const next = documents.map(d => d.id === confirmedDoc.id ? confirmedDoc : d);
    setDocuments(next);
    saveStoredDocuments(next);
    setReviewingDoc(null);

    addAuditLog({
      user: 'Admin Oficina RSG',
      action: 'CONFIRMACION_ALBARAN',
      details: `Albarán ${confirmedDoc.deliveryNoteData?.documentNumber} validado. Discrepancia solventada.`
    });
    setAuditLogs(getStoredAudit());
  };

  // Subida de documentos desde Portal Cliente con procesamiento OCR IA
  const handleUploadDocumentFromClient = async (
    newDocData: Omit<AppDocument, 'id' | 'uploadedAt' | 'auditLogs'>
  ) => {
    const docId = `doc-${Date.now()}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const initialAudit: AuditEntry = {
      id: `aud-${Date.now()}-sub`,
      timestamp,
      user: newDocData.uploadedBy,
      action: 'RECEPCION_DOCUMENTO',
      details: `Documento "${newDocData.originalFilename}" subido para el establecimiento "${newDocData.establishment}".`
    };

    // Procesar con Gemini OCR (o heurística de respaldo)
    let ocrResult = null;
    if (newDocData.fileData && newDocData.fileData.startsWith('data:')) {
      const parts = newDocData.fileData.split(',');
      const mime = parts[0].split(':')[1].split(';')[0];
      const base64 = parts[1];
      ocrResult = await processDocumentWithGemini({ base64, mimeType: mime }, newDocData.clientName);
    } else {
      ocrResult = await processDocumentWithGemini({ base64: '', mimeType: 'application/pdf' }, newDocData.clientName);
    }

    const createdDoc: AppDocument = {
      ...newDocData,
      id: docId,
      uploadedAt: timestamp,
      status: 'PENDING_REVIEW',
      docType: ocrResult.docType,
      aiConfidence: ocrResult.confidence,
      hasDiscrepancy: ocrResult.deliveryNoteData.calculationDiscrepancy,
      deliveryNoteData: ocrResult.deliveryNoteData,
      auditLogs: [
        initialAudit,
        {
          id: `aud-${Date.now()}-ocr`,
          timestamp,
          user: 'Motor Gemini 2.5 Flash',
          action: 'EXTRACCION_OCR',
          details: `Datos extraídos con ${(ocrResult.confidence * 100).toFixed(0)}% de confianza.`
        }
      ]
    };

    const next = [createdDoc, ...documents];
    setDocuments(next);
    saveStoredDocuments(next);

    addAuditLog({
      user: newDocData.uploadedBy,
      action: 'RECEPCION_ALBARAN',
      details: `Cliente ${newDocData.clientName} ha enviado ${newDocData.originalFilename}.`
    });
    setAuditLogs(getStoredAudit());
  };

  const handleUpdateRules = (updatedRules: ClassificationRule[]) => {
    setRules(updatedRules);
    saveStoredRules(updatedRules);
  };

  const handleRestoreBackup = (backup: { clients: Client[]; documents: AppDocument[]; rules: ClassificationRule[] }) => {
    setClients(backup.clients);
    saveStoredClients(backup.clients);

    setDocuments(backup.documents);
    saveStoredDocuments(backup.documents);

    setRules(backup.rules);
    saveStoredRules(backup.rules);

    addAuditLog({
      user: 'Admin Oficina RSG',
      action: 'RESTAURACION_BACKUP',
      details: 'Copia de seguridad restaurada exitosamente.'
    });
    setAuditLogs(getStoredAudit());
  };

  // Entrada autorizada directa desde la ficha de oficina
  const handleImpersonateClient = (client: Client) => {
    setAuthenticatedClient(client);
    setCurrentRole('CLIENT');
    addAuditLog({
      user: 'Admin Oficina RSG',
      action: 'ACCESO_IMPERSONACION',
      details: `Oficina ha abierto el portal de ${client.commercialName} para comprobaciones.`
    });
    setAuditLogs(getStoredAudit());
  };

  // Probar como cliente: Abre la pantalla de Login con su usuario precargado
  const handleTestLoginAsClient = (client: Client) => {
    setAuthenticatedClient(null); // Asegurar que pase por la pantalla de login con contraseña
    setPrefilledUserFromUrl(client.accessId);
    setCurrentRole('CLIENT');
  };

  // Login de cliente exitoso
  const handleClientLoginSuccess = (client: Client) => {
    setAuthenticatedClient(client);
    addAuditLog({
      user: client.contactPerson,
      action: 'LOGIN_CLIENTE',
      details: `Inicio de sesión correcto en portal cliente para ${client.commercialName}.`
    });
    setAuditLogs(getStoredAudit());
  };

  const handleClientLogout = () => {
    if (authenticatedClient) {
      addAuditLog({
        user: authenticatedClient.contactPerson,
        action: 'LOGOUT_CLIENTE',
        details: `Cierre de sesión de ${authenticatedClient.commercialName}.`
      });
      setAuditLogs(getStoredAudit());
    }
    setAuthenticatedClient(null);
  };

  // Firma del contrato RGPD
  const handleSignContract = (clientId: string, signerName: string, signerNif: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updated = clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          contract: {
            isSigned: true,
            signedAt: now,
            signedBy: signerName,
            nifSigner: signerNif,
            contractVersion: 'RGPD-LOPDGDD-2025.1',
            ipAddress: '192.168.1.1'
          }
        };
      }
      return c;
    });

    setClients(updated);
    saveStoredClients(updated);
    if (authenticatedClient && authenticatedClient.id === clientId) {
      setAuthenticatedClient(updated.find(c => c.id === clientId) || null);
    }

    addAuditLog({
      user: signerName,
      action: 'FIRMA_CONTRATO_RGPD',
      details: `Contrato de confidencialidad y tratamiento de datos firmado para cliente ${clientId}.`
    });
    setAuditLogs(getStoredAudit());
    setContractModalClient(null);
  };

  const pendingCount = documents.filter(d => d.status === 'PENDING_REVIEW').length;
  const currentDemoClient = clients.find(c => c.id === selectedClientId) || clients[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        clients={clients}
        selectedClientId={selectedClientId}
        onSelectClient={setSelectedClientId}
        activeTab={activeAdminTab}
        onTabChange={setActiveAdminTab}
        pendingReviewsCount={pendingCount}
        authenticatedClient={authenticatedClient}
        onClientLogout={handleClientLogout}
        onOpenContractModal={() => setContractModalClient(authenticatedClient)}
        onTestClientMode={() => currentDemoClient && handleTestLoginAsClient(currentDemoClient)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentRole === 'ADMIN' ? (
          <>
            {activeAdminTab === 'dashboard' && (
              <AdminDashboard
                documents={documents}
                clients={clients}
                onOpenReview={setReviewingDoc}
                onNavigateTab={setActiveAdminTab}
              />
            )}

            {activeAdminTab === 'clients' && (
              <ClientManagement
                clients={clients}
                documents={documents}
                onUpdateClient={handleUpdateClient}
                onAddClient={handleAddClient}
                onDeleteClient={handleDeleteClient}
                onImpersonateClient={handleImpersonateClient}
                onOpenContractModal={(cli) => setContractModalClient(cli)}
                onTestLoginAsClient={handleTestLoginAsClient}
              />
            )}

            {activeAdminTab === 'documents' && (
              <DocumentList
                documents={documents}
                clients={clients}
                onOpenReview={setReviewingDoc}
              />
            )}

            {activeAdminTab === 'catalog' && (
              <ProductsAndSuppliers documents={documents} />
            )}

            {activeAdminTab === 'reports' && (
              <ReportsView documents={documents} clients={clients} />
            )}

            {activeAdminTab === 'config' && (
              <AuditAndConfig
                rules={rules}
                onUpdateRules={handleUpdateRules}
                auditLogs={auditLogs}
                clients={clients}
                documents={documents}
                onRestoreBackup={handleRestoreBackup}
              />
            )}
          </>
        ) : (
          /* Portal Cliente */
          authenticatedClient ? (
            <ClientPortal
              client={authenticatedClient}
              documents={documents}
              onUploadDocument={handleUploadDocumentFromClient}
              onLogout={handleClientLogout}
            />
          ) : (
            <ClientLogin
              clients={clients}
              onLoginSuccess={handleClientLoginSuccess}
              onSwitchToAdmin={() => setCurrentRole('ADMIN')}
              initialAccessId={prefilledUserFromUrl}
            />
          )
        )}
      </main>

      {/* Modal de Revisión OCR & Validación con doble confirmación */}
      {reviewingDoc && (
        <DeliveryNoteReviewModal
          document={reviewingDoc}
          onClose={() => setReviewingDoc(null)}
          onSaveAndConfirm={handleSaveAndConfirmDocument}
        />
      )}

      {/* Modal de Contrato RGPD y Confidencialidad */}
      {contractModalClient && (
        <LegalContractModal
          client={contractModalClient}
          onClose={() => setContractModalClient(null)}
          onSignContract={handleSignContract}
        />
      )}

      {/* Pie de página oficial de RSG Gestudoc */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-xs py-4 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>RSG Gestudoc (Gestiona tus documentos) • Versión 1.0</span>
          <span className="text-slate-400">
            Conforme a RGPD (UE 2016/679) & LOPDGDD 3/2018 • Plantilla Excel Oficial Integrada
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
