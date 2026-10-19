import React, { useState } from 'react';
import { AppDocument, DeliveryNoteData, LineItem, VatBreakdown } from '../types';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  FileText, 
  Calculator, 
  History,
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface DeliveryNoteReviewModalProps {
  document: AppDocument;
  onClose: () => void;
  onSaveAndConfirm: (updatedDoc: AppDocument) => void;
}

export const DeliveryNoteReviewModal: React.FC<DeliveryNoteReviewModalProps> = ({
  document: doc,
  onClose,
  onSaveAndConfirm
}) => {
  // Datos editables del albarán
  const initialData: DeliveryNoteData = doc.deliveryNoteData || {
    supplierName: '',
    supplierNif: '',
    documentNumber: '',
    documentDate: new Date().toISOString().substring(0, 10),
    currency: 'EUR',
    items: [],
    subtotal: 0,
    vatAmount: 0,
    totalAmount: 0,
    calculationDiscrepancy: false,
    isConfirmed: false
  };

  const [formData, setFormData] = useState<DeliveryNoteData>(() => {
    // Normalizar líneas para asegurar lineBase y lineVatAmount
    const items = (initialData.items || []).map(it => {
      const discount = (it.quantity * it.unitPrice * (it.discountPercent || 0)) / 100;
      const base = (it.quantity * it.unitPrice) - discount;
      const vat = (base * (it.vatPercent || 0)) / 100;
      return {
        ...it,
        lineBase: Number(base.toFixed(2)),
        lineVatAmount: Number(vat.toFixed(2)),
        lineTotal: Number((base + vat).toFixed(2))
      };
    });
    return {
      ...initialData,
      items
    };
  });

  const [activeTab, setActiveTab] = useState<'review' | 'audit'>('review');

  // Estados para el flujo de doble confirmación exigido (Punto 3)
  const [showFirstConfirmModal, setShowFirstConfirmModal] = useState(false);
  const [showSecondConfirmModal, setShowSecondConfirmModal] = useState(false);

  // Recalcular bases, IVA desglosado por tipos y verificar discrepancias
  const recalculateTotals = (items: LineItem[], targetTotal: number) => {
    let sub = 0;
    let vatSum = 0;
    const vatMap = new Map<number, { base: number; vatAmount: number }>();

    items.forEach(item => {
      const discount = (item.quantity * item.unitPrice * (item.discountPercent || 0)) / 100;
      const baseLine = (item.quantity * item.unitPrice) - discount;
      const vatLine = (baseLine * (item.vatPercent || 0)) / 100;

      sub += baseLine;
      vatSum += vatLine;

      const rate = item.vatPercent || 0;
      const existing = vatMap.get(rate) || { base: 0, vatAmount: 0 };
      existing.base += baseLine;
      existing.vatAmount += vatLine;
      vatMap.set(rate, existing);
    });

    const calculatedSubtotal = Number(sub.toFixed(2));
    const calculatedVatAmount = Number(vatSum.toFixed(2));
    const calculatedTotal = Number((calculatedSubtotal + calculatedVatAmount).toFixed(2));

    const breakdown: VatBreakdown[] = Array.from(vatMap.entries()).map(([rate, val]) => ({
      rate,
      base: Number(val.base.toFixed(2)),
      vatAmount: Number(val.vatAmount.toFixed(2))
    }));

    const isDiscrepant = Math.abs(calculatedTotal - targetTotal) > 0.05;

    return {
      calculatedSubtotal,
      calculatedVatAmount,
      calculatedTotal,
      vatBreakdown: breakdown,
      isDiscrepant
    };
  };

  const handleLineChange = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index], [field]: value };

    // Actualizar bases e importes de línea
    const discount = (Number(item.quantity) * Number(item.unitPrice) * (Number(item.discountPercent) || 0)) / 100;
    const base = (Number(item.quantity) * Number(item.unitPrice)) - discount;
    const vat = (base * (Number(item.vatPercent) || 0)) / 100;

    item.lineBase = Number(base.toFixed(2));
    item.lineVatAmount = Number(vat.toFixed(2));
    item.lineTotal = Number((base + vat).toFixed(2));

    updatedItems[index] = item;
    const { calculatedSubtotal, calculatedVatAmount, calculatedTotal, vatBreakdown, isDiscrepant } = recalculateTotals(updatedItems, formData.totalAmount);

    setFormData({
      ...formData,
      items: updatedItems,
      calculatedSubtotal,
      calculatedVatAmount,
      calculatedTotal,
      vatBreakdown,
      calculationDiscrepancy: isDiscrepant
    });
  };

  const handleAddLine = () => {
    const newLine: LineItem = {
      id: `item-${Date.now()}`,
      originalDescription: 'Nueva Línea',
      normalizedProduct: 'Nuevo Producto',
      quantity: 1,
      unit: 'UNIDAD',
      unitPrice: 0,
      discountPercent: 0,
      vatPercent: 10,
      lineBase: 0,
      lineVatAmount: 0,
      lineTotal: 0
    };
    const updatedItems = [...formData.items, newLine];
    const { calculatedSubtotal, calculatedVatAmount, calculatedTotal, vatBreakdown, isDiscrepant } = recalculateTotals(updatedItems, formData.totalAmount);

    setFormData({
      ...formData,
      items: updatedItems,
      calculatedSubtotal,
      calculatedVatAmount,
      calculatedTotal,
      vatBreakdown,
      calculationDiscrepancy: isDiscrepant
    });
  };

  const handleRemoveLine = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const { calculatedSubtotal, calculatedVatAmount, calculatedTotal, vatBreakdown, isDiscrepant } = recalculateTotals(updatedItems, formData.totalAmount);

    setFormData({
      ...formData,
      items: updatedItems,
      calculatedSubtotal,
      calculatedVatAmount,
      calculatedTotal,
      vatBreakdown,
      calculationDiscrepancy: isDiscrepant
    });
  };

  const handleTotalAmountChange = (newVal: number) => {
    const { calculatedSubtotal, calculatedVatAmount, calculatedTotal, vatBreakdown, isDiscrepant } = recalculateTotals(formData.items, newVal);
    setFormData({
      ...formData,
      totalAmount: newVal,
      calculatedSubtotal,
      calculatedVatAmount,
      calculatedTotal,
      vatBreakdown,
      calculationDiscrepancy: isDiscrepant
    });
  };

  // Ajustar automáticamente el total del albarán al cálculo de las líneas
  const handleAutoAdjustTotalToLines = () => {
    const sumLines = (formData.calculatedTotal || (formData.subtotal + formData.vatAmount));
    setFormData({
      ...formData,
      totalAmount: sumLines,
      calculationDiscrepancy: false
    });
  };

  // Botón inicial de validación
  const handleAttemptConfirmation = () => {
    if (formData.calculationDiscrepancy) {
      // Tiene discrepancia: iniciar proceso de 2 preguntas de confirmación
      setShowFirstConfirmModal(true);
    } else {
      // Sin discrepancia: guardar directamente
      executeFinalConfirmation(false);
    }
  };

  // 1ª Confirmación aceptada -> pasar a 2ª confirmación
  const handleAcceptFirstConfirmation = () => {
    setShowFirstConfirmModal(false);
    setShowSecondConfirmModal(true);
  };

  // 2ª Confirmación aceptada -> Guardar y QUITAR DEFINITIVAMENTE la discrepancia (Punto 3)
  const handleAcceptSecondConfirmation = () => {
    setShowSecondConfirmModal(false);
    executeFinalConfirmation(true);
  };

  const executeFinalConfirmation = (forcedDiscrepancyRemoval: boolean) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    
    // Si confirmó dos veces, quitar la discrepancia definitivamente
    const confirmedData: DeliveryNoteData = {
      ...formData,
      isConfirmed: true,
      confirmedAt: now,
      confirmedBy: 'Admin Oficina RSG',
      calculationDiscrepancy: false // Quitado definitivamente según especificación
    };

    const updatedDocument: AppDocument = {
      ...doc,
      status: 'CONFIRMED',
      hasDiscrepancy: false, // Quitado definitivamente
      deliveryNoteData: confirmedData,
      auditLogs: [
        ...doc.auditLogs,
        {
          id: `aud-${Date.now()}`,
          timestamp: now,
          user: 'Admin Oficina RSG',
          action: 'VALIDACION_ALBARAN',
          details: forcedDiscrepancyRemoval
            ? `Albarán ${confirmedData.documentNumber} validado con doble confirmación humana de oficina. Discrepancia solventada y anulada.`
            : `Albarán ${confirmedData.documentNumber} confirmado sin incidencias.`
        }
      ]
    };

    onSaveAndConfirm(updatedDocument);
  };

  const diffAmount = formData.calculatedTotal ? Math.abs(formData.calculatedTotal - formData.totalAmount) : 0;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Cabecera Modal */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Revisión y Validación de Albarán — RSG Gestudoc
              </h2>
              {formData.calculationDiscrepancy ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3" /> DISCREPANCIA ACTIVA
                </span>
              ) : formData.isConfirmed ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CONFIRMADO & CUADRADO
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PENDIENTE DE CONFIRMACIÓN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cliente: <strong className="text-white">{doc.clientName}</strong> • Archivo: {doc.originalFilename}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                className={`px-3 py-1 rounded font-medium ${activeTab === 'review' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Datos & OCR
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1 rounded font-medium flex items-center gap-1 ${activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Historial</span>
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        {activeTab === 'review' ? (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Columna Izquierda: Visor del archivo original */}
            <div className="lg:col-span-4 p-4 bg-slate-50 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Documento Original Custodiado</span>
                <span className="text-slate-400 font-mono text-[11px]">{doc.fileType}</span>
              </div>

              <div className="flex-1 min-h-[300px] bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden group">
                {doc.fileData ? (
                  <img
                    src={doc.fileData}
                    alt="Documento Albarán"
                    className="max-h-[420px] object-contain rounded shadow"
                  />
                ) : (
                  <div className="space-y-3 p-4">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{doc.originalFilename}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Archivo original protegido y conservado inalterable.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg text-left text-[11px] space-y-1 font-mono text-slate-600">
                      <div>Emisor: {formData.supplierName || '—'}</div>
                      <div>Doc: {formData.documentNumber || '—'}</div>
                      <div>Fecha: {formData.documentDate || '—'}</div>
                      <div>Total pie: {formData.totalAmount.toFixed(2)} €</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100">
                🔒 RSG Gestudoc conserva intacto el archivo original aunque se modifiquen las líneas para garantizar validez legal y auditoría contable.
              </div>
            </div>

            {/* Columna Derecha: Formulario editable con datos extraídos */}
            <div className="lg:col-span-8 p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                {/* ALERTA ROJA DE DISCREPANCIA (Punto 3: señalada claramente en rojo donde está) */}
                {formData.calculationDiscrepancy && (
                  <div className="p-3.5 bg-rose-50 border-2 border-rose-500 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-900 shadow-sm animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-rose-800 block">
                          ¡DISCREPANCIA EN EL CÁLCULO DETECTADA! (Diferencia de {diffAmount.toFixed(2)} €)
                        </strong>
                        <p className="text-[11px] text-rose-700 mt-0.5">
                          • La suma de las líneas da un total de <strong>{(formData.calculatedTotal || 0).toFixed(2)} €</strong>.<br />
                          • El Total indicado en el pie del albarán original es <strong>{formData.totalAmount.toFixed(2)} €</strong>.<br />
                          Comprueba las líneas marcadas en rojo o pulsa en "Ajustar al sumatorio".
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoAdjustTotalToLines}
                      className="shrink-0 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow transition-colors"
                      title="Ajusta el Total del albarán al sumatorio real de las líneas"
                    >
                      Ajustar al sumatorio ({ (formData.calculatedTotal || 0).toFixed(2) } €)
                    </button>
                  </div>
                )}

                {/* Cabecera del Albarán */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Nombre Proveedor *</label>
                    <input
                      type="text"
                      value={formData.supplierName}
                      onChange={e => setFormData({ ...formData, supplierName: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">NIF Proveedor</label>
                    <input
                      type="text"
                      value={formData.supplierNif}
                      onChange={e => setFormData({ ...formData, supplierNif: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Nº Albarán *</label>
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Fecha del Albarán</label>
                    <input
                      type="date"
                      value={formData.documentDate}
                      onChange={e => setFormData({ ...formData, documentDate: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Moneda</label>
                    <input
                      type="text"
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Tabla de Líneas de Producto con desglose de Base e IVA (Punto 3) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-indigo-600" />
                      Líneas de Producto ({formData.items.length}) — con cuantías de Base e IVA
                    </span>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Línea</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="p-2 min-w-[140px]">Descripción Original</th>
                          <th className="p-2 min-w-[130px]">Producto Normalizado</th>
                          <th className="p-2 w-16 text-right">Cant.</th>
                          <th className="p-2 w-14 text-center">Ud.</th>
                          <th className="p-2 w-20 text-right">Precio Ud.</th>
                          <th className="p-2 w-14 text-right">% Dto</th>
                          <th className="p-2 w-20 text-right font-bold text-indigo-900">Base Imp.</th>
                          <th className="p-2 w-14 text-center">% IVA</th>
                          <th className="p-2 w-16 text-right font-bold text-indigo-900">Cuota IVA</th>
                          <th className="p-2 w-20 text-right font-bold">Total Línea</th>
                          <th className="p-2 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData.items.map((line, idx) => {
                          const discount = (line.quantity * line.unitPrice * (line.discountPercent || 0)) / 100;
                          const base = (line.quantity * line.unitPrice) - discount;
                          const vat = (base * (line.vatPercent || 0)) / 100;
                          const total = base + vat;

                          return (
                            <tr key={line.id} className="hover:bg-slate-50/70">
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={line.originalDescription}
                                  onChange={e => handleLineChange(idx, 'originalDescription', e.target.value)}
                                  className="w-full p-1 border border-slate-200 rounded text-xs text-slate-800"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={line.normalizedProduct}
                                  onChange={e => handleLineChange(idx, 'normalizedProduct', e.target.value)}
                                  className="w-full p-1 border border-slate-200 rounded text-xs bg-indigo-50/40 text-indigo-900 font-medium"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="number"
                                  step="any"
                                  value={line.quantity}
                                  onChange={e => handleLineChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="w-full p-1 border border-slate-200 rounded text-xs text-right font-mono text-slate-800"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={line.unit}
                                  onChange={e => handleLineChange(idx, 'unit', e.target.value)}
                                  className="w-full p-1 border border-slate-200 rounded text-xs font-mono uppercase text-center text-slate-800"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="number"
                                  step="any"
                                  value={line.unitPrice}
                                  onChange={e => handleLineChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-full p-1 border border-slate-200 rounded text-xs text-right font-mono text-slate-800"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="number"
                                  step="any"
                                  value={line.discountPercent}
                                  onChange={e => handleLineChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                                  className="w-full p-1 border border-slate-200 rounded text-xs text-right font-mono text-slate-800"
                                />
                              </td>

                              {/* Base Imponible de línea calculada */}
                              <td className="p-1.5 text-right font-mono font-semibold text-slate-800 bg-slate-50/60">
                                {base.toFixed(2)} €
                              </td>

                              {/* Tipo de IVA */}
                              <td className="p-1.5">
                                <select
                                  value={line.vatPercent}
                                  onChange={e => handleLineChange(idx, 'vatPercent', parseFloat(e.target.value) || 0)}
                                  className="w-full p-1 border border-slate-200 rounded text-xs text-slate-800 font-semibold"
                                >
                                  <option value={0}>0%</option>
                                  <option value={4}>4%</option>
                                  <option value={10}>10%</option>
                                  <option value={21}>21%</option>
                                </select>
                              </td>

                              {/* Cuota IVA de línea calculada */}
                              <td className="p-1.5 text-right font-mono font-semibold text-indigo-700 bg-indigo-50/30">
                                {vat.toFixed(2)} €
                              </td>

                              {/* Total Línea */}
                              <td className="p-1.5 text-right font-bold text-slate-900 font-mono">
                                {total.toFixed(2)} €
                              </td>

                              <td className="p-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resumen de Base Imponible, Cuotas de IVA y Total Albarán (Punto 3: Señalado en rojo si discrepa) */}
                <div className={`p-4 rounded-xl border transition-all text-xs ${
                  formData.calculationDiscrepancy 
                    ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-200' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Desglose de IVA por tramos */}
                    <div className="space-y-1 text-slate-600">
                      <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                        Desglose de Bases y Cuotas de IVA:
                      </span>
                      {formData.vatBreakdown && formData.vatBreakdown.length > 0 ? (
                        <div className="space-y-0.5">
                          {formData.vatBreakdown.map(vb => (
                            <div key={vb.rate} className="flex gap-4 font-mono text-[11px]">
                              <span>IVA {vb.rate}%:</span>
                              <span>Base: <strong>{vb.base.toFixed(2)} €</strong></span>
                              <span>Cuota: <strong>{vb.vatAmount.toFixed(2)} €</strong></span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No hay líneas introducidas.</p>
                      )}
                    </div>

                    {/* Totales y Comparativa con el Pie */}
                    <div className="space-y-1.5 text-right min-w-[240px]">
                      <div className="flex justify-between gap-4 text-slate-700">
                        <span>Base Imponible Total:</span>
                        <span className="font-mono font-bold">
                          {(formData.calculatedSubtotal || formData.subtotal).toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-700">
                        <span>Cuota Total IVA:</span>
                        <span className="font-mono font-bold text-indigo-700">
                          {(formData.calculatedVatAmount || formData.vatAmount).toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-xs font-semibold text-slate-600 border-t pt-1">
                        <span>Suma recalculada líneas:</span>
                        <span className="font-mono">
                          {(formData.calculatedTotal || 0).toFixed(2)} €
                        </span>
                      </div>

                      {/* Total del albarán (editable). Si discrepa, se marca en ROJO */}
                      <div className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border ${
                        formData.calculationDiscrepancy 
                          ? 'bg-rose-100 border-rose-500 text-rose-950 font-bold' 
                          : 'bg-white border-slate-200 text-slate-900 font-bold'
                      }`}>
                        <span className="text-xs">Total del Albarán:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            value={formData.totalAmount}
                            onChange={e => handleTotalAmountChange(parseFloat(e.target.value) || 0)}
                            className={`w-28 p-1 text-right rounded font-mono font-bold text-sm ${
                              formData.calculationDiscrepancy 
                                ? 'bg-rose-50 border-2 border-rose-600 text-rose-700' 
                                : 'bg-slate-50 border border-slate-300 text-indigo-900'
                            }`}
                          />
                          <span>€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botonera de Acción */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cerrar sin guardar
                </button>
                <button
                  type="button"
                  onClick={handleAttemptConfirmation}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-2 ${
                    formData.calculationDiscrepancy
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {formData.calculationDiscrepancy ? 'Confirmar (Resolver discrepancia)' : 'Validar & Confirmar Albarán'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Historial y Auditoría */
          <div className="p-6 overflow-y-auto space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              Trazabilidad y Auditoría del Documento
            </h3>
            <p className="text-xs text-slate-500">
              Registro inmutable de subidas, reconocimientos de IA y revisiones por parte del administrador.
            </p>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {doc.auditLogs.map(log => (
                <div key={log.id} className="p-3 text-xs flex items-start justify-between bg-white hover:bg-slate-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {log.user}
                      </span>
                    </div>
                    <p className="text-slate-600">{log.details}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1 DE DOBLE CONFIRMACIÓN (Punto 3) */}
      {showFirstConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-300 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">1ª Confirmación de Validación</h3>
                <p className="text-xs text-amber-800">Existe una diferencia de cálculo activa.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              El sumatorio de las líneas (<strong>{(formData.calculatedTotal || 0).toFixed(2)} €</strong>) no coincide con el total del albarán (<strong>{formData.totalAmount.toFixed(2)} €</strong>).
            </p>
            <p className="text-xs text-slate-800 font-semibold bg-amber-50 p-3 rounded-lg border border-amber-200">
              ¿Deseas validar este albarán asumiendo los datos introducidos como correctos y anular la alerta de discrepancia?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFirstConfirmModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar y seguir editando
              </button>
              <button
                type="button"
                onClick={handleAcceptFirstConfirmation}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow"
              >
                Sí, continuar a confirmación definitiva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 DE DOBLE CONFIRMACIÓN DEFINITIVA (Punto 3) */}
      {showSecondConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-emerald-500 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-emerald-800">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">2ª Confirmación Definitiva</h3>
                <p className="text-xs text-emerald-700">Resolución de discrepancia garantizada.</p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <p className="font-bold">Al confirmar por segunda vez:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-emerald-900">
                <li>La etiqueta de <strong>Discrepancia se ELIMINARÁ por completo</strong> del albarán.</li>
                <li>El albarán quedará marcado como <strong>VALIDADO & CONFIRMADO</strong>.</li>
                <li>Los productos, precios y proveedores se incorporarán a los informes oficiales.</li>
              </ul>
            </div>

            <p className="text-xs text-slate-700 font-semibold text-center">
              ¿Confirmas definitivamente que los datos son correctos?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSecondConfirmModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleAcceptSecondConfirmation}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Confirmar y Quitar Discrepancia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
