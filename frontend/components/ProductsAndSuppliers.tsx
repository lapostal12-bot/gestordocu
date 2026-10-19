import React, { useState } from 'react';
import { AppDocument, ProductMaster, SupplierMaster } from '../types';
import { 
  Users, 
  Package, 
  Search, 
  TrendingUp, 
  Building2, 
  Layers, 
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface ProductsAndSuppliersProps {
  documents: AppDocument[];
}

export const ProductsAndSuppliers: React.FC<ProductsAndSuppliersProps> = ({ documents }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'suppliers'>('products');
  const [searchTerm, setSearchTerm] = useState('');

  // Solo consideramos albaranes confirmados para el catálogo estructurado (requisito de la especificación)
  const confirmedDocs = documents.filter(d => d.status === 'CONFIRMED' && d.deliveryNoteData);

  // Construir catálogo de productos
  const productMap = new Map<string, ProductMaster>();

  confirmedDocs.forEach(doc => {
    const data = doc.deliveryNoteData!;
    data.items.forEach(item => {
      const key = item.normalizedProduct.toLowerCase().trim();
      const existing = productMap.get(key);

      if (!existing) {
        productMap.set(key, {
          id: `prod-${key}`,
          normalizedName: item.normalizedProduct,
          unit: item.unit,
          supplierName: data.supplierName,
          lastPrice: item.unitPrice,
          minPrice: item.unitPrice,
          maxPrice: item.unitPrice,
          totalPurchasedQty: item.quantity,
          history: [
            {
              date: data.documentDate,
              price: item.unitPrice,
              documentNumber: data.documentNumber,
              clientName: doc.clientName
            }
          ]
        });
      } else {
        existing.totalPurchasedQty += item.quantity;
        if (item.unitPrice < existing.minPrice) existing.minPrice = item.unitPrice;
        if (item.unitPrice > existing.maxPrice) existing.maxPrice = item.unitPrice;
        existing.lastPrice = item.unitPrice;
        existing.history.push({
          date: data.documentDate,
          price: item.unitPrice,
          documentNumber: data.documentNumber,
          clientName: doc.clientName
        });
      }
    });
  });

  const productsList = Array.from(productMap.values()).filter(p =>
    p.normalizedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Construir catálogo de proveedores
  const supplierMap = new Map<string, SupplierMaster>();

  confirmedDocs.forEach(doc => {
    const data = doc.deliveryNoteData!;
    const key = data.supplierName.toLowerCase().trim();
    const existing = supplierMap.get(key);

    if (!existing) {
      supplierMap.set(key, {
        id: `sup-${key}`,
        name: data.supplierName,
        nif: data.supplierNif || 'B-Pendiente',
        documentCount: 1,
        totalSpend: data.totalAmount
      });
    } else {
      existing.documentCount += 1;
      existing.totalSpend += data.totalAmount;
    }
  });

  const suppliersList = Array.from(supplierMap.values()).filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Maestro de Productos y Proveedores
          </h1>
          <p className="text-xs text-slate-500">
            Registros consolidados automáticamente a partir de los albaranes validados y confirmados.
          </p>
        </div>

        {/* Selector de sub-pestaña */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'products' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Productos ({productsList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'suppliers' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Proveedores ({suppliersList.length})</span>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'products' ? 'Buscar producto o proveedor...' : 'Buscar proveedor o CIF...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Contenido según pestaña */}
      {activeTab === 'products' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Producto Normalizado</th>
                  <th className="py-3 px-4">Proveedor Habitual</th>
                  <th className="py-3 px-4 text-center">Unidad</th>
                  <th className="py-3 px-4 text-right">Último Precio</th>
                  <th className="py-3 px-4 text-right">Rango Precios (Mín - Máx)</th>
                  <th className="py-3 px-4 text-right">Volumen Comprado</th>
                  <th className="py-3 px-4 text-center">Historial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No hay productos confirmados en el catálogo aún. Valida albaranes para generarlos.
                    </td>
                  </tr>
                ) : (
                  productsList.map(prod => (
                    <tr key={prod.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{prod.normalizedName}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {prod.supplierName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {prod.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {prod.lastPrice.toFixed(2)} €
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 font-mono text-[11px]">
                        {prod.minPrice.toFixed(2)} € — {prod.maxPrice.toFixed(2)} €
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-700">
                        {prod.totalPurchasedQty.toFixed(1)} {prod.unit}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400 text-[11px]">
                        {prod.history.length} compras
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliersList.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              No hay proveedores confirmados aún.
            </div>
          ) : (
            suppliersList.map(sup => (
              <div key={sup.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{sup.name}</h3>
                    <span className="text-xs font-mono text-slate-500">NIF: {sup.nif}</span>
                  </div>
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Albaranes</span>
                    <span className="font-semibold text-slate-800">{sup.documentCount} validados</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Facturación total</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {sup.totalSpend.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
