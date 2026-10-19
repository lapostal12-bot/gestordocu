import React, { useState } from 'react';
import { ClassificationRule, AuditEntry, AppDocument, Client } from '../types';
import { 
  Settings, 
  ShieldCheck, 
  Sliders, 
  Database, 
  History, 
  Download, 
  Upload, 
  CheckCircle2,
  Lock
} from 'lucide-react';

interface AuditAndConfigProps {
  rules: ClassificationRule[];
  onUpdateRules: (rules: ClassificationRule[]) => void;
  auditLogs: AuditEntry[];
  clients: Client[];
  documents: AppDocument[];
  onRestoreBackup: (backup: { clients: Client[]; documents: AppDocument[]; rules: ClassificationRule[] }) => void;
}

export const AuditAndConfig: React.FC<AuditAndConfigProps> = ({
  rules,
  onUpdateRules,
  auditLogs,
  clients,
  documents,
  onRestoreBackup
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'audit' | 'backup'>('rules');

  const handleToggleRule = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, active: !r.active } : r);
    onUpdateRules(updated);
  };

  const handleThresholdChange = (id: string, threshold: number) => {
    const updated = rules.map(r => r.id === id ? { ...r, autoConfirmThreshold: threshold } : r);
    onUpdateRules(updated);
  };

  // Generar y descargar copia de seguridad JSON
  const handleDownloadBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      clients,
      documents,
      rules,
      auditLogs
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `copia_seguridad_gestordoc_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.clients && parsed.documents) {
          onRestoreBackup({
            clients: parsed.clients,
            documents: parsed.documents,
            rules: parsed.rules || rules
          });
          alert('Copia de seguridad restaurada correctamente.');
        } else {
          alert('El archivo no contiene un formato de respaldo válido de GestorDoc.');
        }
      } catch (err) {
        alert('Error al leer el archivo de copia de seguridad.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Configuración, Seguridad & Auditoría
          </h1>
          <p className="text-xs text-slate-500">
            Reglas de autonomía OCR, copias de seguridad cifradas y registro de actividades.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 ${activeTab === 'rules' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
          >
            <Sliders className="w-4 h-4" />
            <span>Reglas OCR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 ${activeTab === 'backup' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
          >
            <Database className="w-4 h-4" />
            <span>Copias Seguridad</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 ${activeTab === 'audit' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
          >
            <History className="w-4 h-4" />
            <span>Registro Auditoría</span>
          </button>
        </div>
      </div>

      {activeTab === 'rules' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Reglas de Clasificación Automática de IA</h2>
            <p className="text-xs text-slate-500">
              Define las palabras clave y umbrales de confianza mínimos exigidos a la IA antes de proponer albaranes o facturas.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {rules.map(rule => (
              <div key={rule.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Palabra Clave: "{rule.keyword}"</span>
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-semibold">
                      Tipo: {rule.targetDocType}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Si la confianza del OCR es inferior al umbral fijado, se bloquea la confirmación automática y se exige revisión humana.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Umbral Mínimo:</span>
                    <input
                      type="number"
                      min={70}
                      max={99}
                      value={rule.autoConfirmThreshold}
                      onChange={e => handleThresholdChange(rule.id, parseInt(e.target.value) || 90)}
                      className="w-16 p-1 border rounded text-center font-mono"
                    />
                    <span className="text-slate-500">%</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleRule(rule.id)}
                    className={`px-3 py-1 rounded-lg font-semibold ${
                      rule.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {rule.active ? 'Activa' : 'Desactivada'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Copias de Seguridad y Restauración</h2>
            <p className="text-xs text-slate-500">
              Exporta una copia completa de las fichas de los 20 clientes, documentos, albaranes e historial para custodia segura.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Download className="w-5 h-5 text-indigo-600" />
                Descargar Copia Completa
              </div>
              <p className="text-xs text-slate-600">
                Genera un archivo JSON con los datos estructurados, referencias de albaranes y auditoría.
              </p>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
              >
                Descargar Respaldo JSON
              </button>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Upload className="w-5 h-5 text-slate-600" />
                Restaurar desde Respaldo
              </div>
              <p className="text-xs text-slate-600">
                Restaura el estado de la aplicación a partir de un archivo JSON generado previamente.
              </p>
              <label className="block w-full text-center py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm">
                <span>Seleccionar Archivo de Respaldo</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registro General de Auditoría del Sistema</h2>
            <p className="text-xs text-slate-500">
              Trazabilidad inmutable de accesos, recepciones, digitalizaciones y confirmaciones.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                      {log.user}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{log.details}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
