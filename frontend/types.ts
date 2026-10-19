export type UserRole = 'ADMIN' | 'CLIENT'; 

export interface ContractSignature {
  isSigned: boolean;
  signedAt?: string;
  signedBy?: string;
  nifSigner?: string;
  contractVersion: string;
  ipAddress?: string;
}

export interface Client {
  id: string;
  internalCode: string;
  commercialName: string;
  legalName: string;
  nif: string;
  contactPerson: string;
  email: string;
  phone: string;
  establishments: string[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  notes?: string;
  documentsCount?: number;
  // Credenciales privadas para el acceso del cliente
  accessId: string;
  accessPassword: string;
  // Estado legal de protección de datos y contrato
  contract?: ContractSignature;
}

export interface LineItem {
  id: string;
  originalDescription: string;
  normalizedProduct: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  vatPercent: number;
  lineBase: number;
  lineVatAmount: number;
  lineTotal: number;
}

export interface VatBreakdown {
  rate: number;
  base: number;
  vatAmount: number;
}

export interface DeliveryNoteData {
  supplierName: string;
  supplierNif: string;
  documentNumber: string;
  documentDate: string;
  currency: string;
  items: LineItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  vatBreakdown?: VatBreakdown[];
  calculatedSubtotal?: number;
  calculatedVatAmount?: number;
  calculatedTotal?: number;
  calculationDiscrepancy?: boolean;
  notes?: string;
  isConfirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export type DocumentStatus = 'RECEIVED' | 'PROCESSING' | 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED' | 'ERROR';
export type DocumentCategory = 'ALBARAN' | 'FACTURA' | 'TICKET' | 'OTRO';

export interface AppDocument {
  id: string;
  clientId: string;
  clientName: string;
  establishment?: string;
  uploadedBy: string;
  uploadedAt: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  status: DocumentStatus;
  docType: DocumentCategory;
  fileData?: string; // base64 preview or SVG placeholder
  deliveryNoteData?: DeliveryNoteData;
  auditLogs: AuditEntry[];
  hasDiscrepancy?: boolean;
  aiConfidence?: number;
}

export interface ProductMaster {
  id: string;
  normalizedName: string;
  unit: string;
  supplierName: string;
  lastPrice: number;
  minPrice: number;
  maxPrice: number;
  totalPurchasedQty: number;
  history: {
    date: string;
    price: number;
    documentNumber: string;
    clientName: string;
  }[];
}

export interface SupplierMaster {
  id: string;
  name: string;
  nif: string;
  phone?: string;
  contact?: string;
  documentCount: number;
  totalSpend: number;
}

export interface ClassificationRule {
  id: string;
  keyword: string;
  targetDocType: DocumentCategory;
  autoConfirmThreshold: number;
  active: boolean;
}
