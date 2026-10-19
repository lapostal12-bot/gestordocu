import { Client, AppDocument, ClassificationRule, AuditEntry } from '../types';

const CLIENTS_STORAGE_KEY = 'rsg_gestudoc_clients_v3';
const DOCUMENTS_STORAGE_KEY = 'rsg_gestudoc_documents_v3';
const AUDIT_STORAGE_KEY = 'rsg_gestudoc_audit_v3';
const RULES_STORAGE_KEY = 'rsg_gestudoc_rules_v3';

// Un solo restaurante en modo prueba, preparado para empezar a trabajar (Punto 4)
export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-001',
    internalCode: 'CLI-001',
    commercialName: 'Restaurante El Fogón (Prueba)',
    legalName: 'Hostelería El Fogón S.L.',
    nif: 'B82910293',
    contactPerson: 'Carlos Mendoza',
    email: 'carlos@elfogon.es',
    phone: '912 345 678',
    establishments: ['Sede Centro', 'Terraza Paseo'],
    status: 'ACTIVE',
    createdAt: '2025-02-01',
    notes: 'Cliente piloto para pruebas iniciales de recepción y validación.',
    accessId: 'fogon',
    accessPassword: 'fogon2025',
    contract: {
      isSigned: true,
      signedAt: '2025-02-01 10:30',
      signedBy: 'Carlos Mendoza',
      nifSigner: 'B82910293',
      contractVersion: 'RGPD-LOPDGDD-2025.1',
      ipAddress: '192.168.1.45'
    }
  }
];

export const INITIAL_DOCUMENTS: AppDocument[] = [
  {
    id: 'doc-001',
    clientId: 'cli-001',
    clientName: 'Restaurante El Fogón (Prueba)',
    establishment: 'Sede Centro',
    uploadedBy: 'Carlos Mendoza',
    uploadedAt: '2025-02-20 09:14',
    originalFilename: 'albaran_distribuciones_frescos_A1042.pdf',
    fileType: 'application/pdf',
    fileSize: 342150,
    status: 'PENDING_REVIEW',
    docType: 'ALBARAN',
    aiConfidence: 0.94,
    hasDiscrepancy: true,
    auditLogs: [
      { id: 'aud-1', timestamp: '2025-02-20 09:14', user: 'Carlos Mendoza', action: 'SUBIDA', details: 'Documento recibido desde portal cliente.' },
      { id: 'aud-2', timestamp: '2025-02-20 09:15', user: 'Sistema OCR RSG', action: 'EXTRACCION', details: 'OCR procesado. Discrepancia detectada entre pie de albarán y suma de líneas.' }
    ],
    deliveryNoteData: {
      supplierName: 'Distribuciones del Campo S.A.',
      supplierNif: 'A28019283',
      documentNumber: 'ALB-2025-1042',
      documentDate: '2025-02-20',
      currency: 'EUR',
      isConfirmed: false,
      subtotal: 312.50,
      vatAmount: 31.25,
      totalAmount: 345.00, // Discrepancia voluntaria: 312.50 + 31.25 = 343.75 != 345.00
      calculatedSubtotal: 312.50,
      calculatedVatAmount: 31.25,
      calculatedTotal: 343.75,
      calculationDiscrepancy: true,
      vatBreakdown: [
        { rate: 10, base: 312.50, vatAmount: 31.25 }
      ],
      items: [
        {
          id: 'item-1',
          originalDescription: 'Solomillo de Ternera Rubia Gallega',
          normalizedProduct: 'Solomillo de Ternera',
          quantity: 12.5,
          unit: 'KG',
          unitPrice: 19.50,
          discountPercent: 0,
          vatPercent: 10,
          lineBase: 243.75,
          lineVatAmount: 24.38,
          lineTotal: 268.13
        },
        {
          id: 'item-2',
          originalDescription: 'Aceite de Oliva Virgen Extra 5L',
          normalizedProduct: 'Aceite de Oliva Virgen Extra',
          quantity: 2,
          unit: 'GARRAFA',
          unitPrice: 34.375,
          discountPercent: 0,
          vatPercent: 10,
          lineBase: 68.75,
          lineVatAmount: 6.88,
          lineTotal: 75.63
        }
      ]
    }
  }
];

export const INITIAL_RULES: ClassificationRule[] = [
  { id: 'r-1', keyword: 'albarán', targetDocType: 'ALBARAN', autoConfirmThreshold: 95, active: true },
  { id: 'r-2', keyword: 'nota de entrega', targetDocType: 'ALBARAN', autoConfirmThreshold: 90, active: true },
  { id: 'r-3', keyword: 'factura', targetDocType: 'FACTURA', autoConfirmThreshold: 95, active: true },
  { id: 'r-4', keyword: 'ticket de compra', targetDocType: 'TICKET', autoConfirmThreshold: 85, active: true }
];

export function getStoredClients(): Client[] {
  try {
    const data = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(INITIAL_CLIENTS));
      return INITIAL_CLIENTS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_CLIENTS;
  }
}

export function saveStoredClients(clients: Client[]): void {
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
}

export function getStoredDocuments(): AppDocument[] {
  try {
    const data = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(INITIAL_DOCUMENTS));
      return INITIAL_DOCUMENTS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_DOCUMENTS;
  }
}

export function saveStoredDocuments(docs: AppDocument[]): void {
  localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(docs));
}

export function getStoredRules(): ClassificationRule[] {
  try {
    const data = localStorage.getItem(RULES_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(INITIAL_RULES));
      return INITIAL_RULES;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_RULES;
  }
}

export function saveStoredRules(rules: ClassificationRule[]): void {
  localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
}

export function getStoredAudit(): AuditEntry[] {
  try {
    const data = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!data) {
      const initialAudit: AuditEntry[] = [
        { 
          id: 'ini-1', 
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), 
          user: 'Sistema RSG Gestudoc', 
          action: 'INICIALIZACION', 
          details: 'Inicializado entorno limpio de RSG Gestudoc con 1 cliente de prueba.' 
        }
      ];
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(initialAudit));
      return initialAudit;
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function addAuditLog(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
  const current = getStoredAudit();
  const newLog: AuditEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    ...entry
  };
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([newLog, ...current]));
}
