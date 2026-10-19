import React, { useState } from 'react';
import { Client } from '../types';
import { 
  X, 
  ShieldCheck, 
  FileCheck, 
  Printer, 
  Download, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Building2
} from 'lucide-react';

interface LegalContractModalProps {
  client: Client;
  onClose: () => void;
  onSignContract: (clientId: string, signerName: string, signerNif: string) => void;
}

export const LegalContractModal: React.FC<LegalContractModalProps> = ({
  client,
  onClose,
  onSignContract
}) => {
  const [signerName, setSignerName] = useState(client.contactPerson);
  const [signerNif, setSignerNif] = useState(client.nif);
  const [acceptedClauses, setAcceptedClauses] = useState({
    rgpd: client.contract?.isSigned || false,
    confidentiality: client.contract?.isSigned || false,
    security: client.contract?.isSigned || false
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const canSign = acceptedClauses.rgpd && acceptedClauses.confidentiality && acceptedClauses.security && signerName && signerNif;

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSign) return;
    onSignContract(client.id, signerName, signerNif);
    setHasSubmitted(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Cabecera */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Contrato de Tratamiento y Confidencialidad de Datos</h2>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  RGPD / LOPDGDD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                RSG Gestudoc — Acuerdo vinculante de Encargado de Tratamiento (Art. 28 RGPD)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1"
              title="Imprimir o guardar PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Contrato (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed font-sans">
          {/* Identificación de partes */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong className="text-slate-900 block text-sm font-bold">DE UNA PARTE (PRESTADOR):</strong>
              <p className="mt-1 font-semibold text-indigo-700">RSG GESTUDOC (Gestiona tus documentos)</p>
              <p className="text-slate-500">En adelante, el "ENCARGADO DEL TRATAMIENTO".</p>
              <p className="text-slate-500">Proveedor de software de digitalización, OCR y custodia documental.</p>
            </div>
            <div>
              <strong className="text-slate-900 block text-sm font-bold">DE OTRA PARTE (CLIENTE):</strong>
              <p className="mt-1 font-semibold text-slate-900">{client.commercialName} ({client.legalName})</p>
              <p className="text-slate-600">NIF: <span className="font-mono font-bold">{client.nif}</span></p>
              <p className="text-slate-600">Representante: {client.contactPerson}</p>
              <p className="text-slate-500">En adelante, el "RESPONSABLE DEL TRATAMIENTO".</p>
            </div>
          </div>

          {/* Cláusulas Legales Redactadas */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              ESTIPULACIONES DEL CONTRATO
            </h3>

            <div className="space-y-2">
              <strong className="text-slate-900 block font-bold">CLÁUSULA 1. OBJETO Y ENCARGO DE TRATAMIENTO (Art. 28 RGPD)</strong>
              <p>
                El Responsable del Tratamiento contrata los servicios de <strong>RSG Gestudoc</strong> con la finalidad de gestionar, digitalizar mediante reconocimiento óptico de caracteres (OCR), extraer datos económicos y custodiar de forma segura sus albaranes, notas de entrega, facturas comerciales y documentos mercantiles.
              </p>
              <p>
                RSG Gestudoc tratará los datos personales, fiscales y comerciales contenidos en los documentos única y exclusivamente conforme a las instrucciones documentadas del Responsable del Tratamiento y para los fines estrictamente pactados.
              </p>
            </div>

            <div className="space-y-2">
              <strong className="text-slate-900 block font-bold">CLÁUSULA 2. DEBER DE CONFIDENCIALIDAD Y SECRETO PROFESIONAL</strong>
              <p>
                RSG Gestudoc garantiza que todo su personal, desarrolladores y colaboradores autorizados están sujetos a un <strong>estricto deber de confidencialidad y secreto profesional indefinido</strong>, el cual subsistirá incluso tras la finalización de la relación contractual.
              </p>
              <p>
                Bajo ninguna circunstancia los datos, precios de compra, proveedores o documentos del Cliente serán comercializados, cedidos, comunicados o puestos a disposición de terceros sin autorización expresa previa y por escrito.
              </p>
            </div>

            <div className="space-y-2">
              <strong className="text-slate-900 block font-bold">CLÁUSULA 3. MEDIDAS DE SEGURIDAD TÉCNICAS Y ORGANIZATIVAS (Art. 32 RGPD)</strong>
              <p>
                RSG Gestudoc se compromete a implementar medidas técnicas para garantizar un nivel de seguridad adecuado al riesgo, incluyendo:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Separación estricta y lógica de datos por cliente:</strong> Ningún establecimiento cliente puede acceder a documentos, precios ni informes de otro cliente.</li>
                <li><strong>Cifrado y credenciales individuales:</strong> Acceso mediante identificador de usuario y clave secreta personal.</li>
                <li><strong>Trazabilidad y registro de auditoría:</strong> Registro inmutable de subidas, revisiones, confirmaciones y descargas.</li>
                <li><strong>Copias de seguridad regulares y capacidad de restauración</strong> para garantizar la resiliencia y disponibilidad permanente de los datos originales.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <strong className="text-slate-900 block font-bold">CLÁUSULA 4. DESTINO DE LOS DOCUMENTOS Y DERECHO AL BORRADO</strong>
              <p>
                A la finalización de la prestación de servicios, a elección del Cliente, RSG Gestudoc devolverá o destruirá todos los datos y copias de los documentos existentes en sus servidores, salvo que la legislación tributaria o mercantil española exija su conservación durante los plazos legalmente previstos.
              </p>
            </div>

            <div className="space-y-2">
              <strong className="text-slate-900 block font-bold">CLÁUSULA 5. EJERCICIO DE DERECHOS Y LEGISLACIÓN APLICABLE</strong>
              <p>
                El Cliente podrá ejercer en cualquier momento sus derechos de acceso, rectificación, supresión, limitación del tratamiento y portabilidad reconocidos en el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD). El presente contrato se rige íntegramente por la legislación española.
              </p>
            </div>
          </div>

          {/* Estado de firma o Formulario de aceptación */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Estado de Firma y Aceptación Formal
            </h4>

            {client.contract?.isSigned ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>CONTRATO EN VIGOR Y FIRMADO DIGITALMENTE</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-slate-700">
                  <div><strong>Firmado por:</strong> {client.contract.signedBy} ({client.contract.nifSigner})</div>
                  <div><strong>Fecha y hora:</strong> {client.contract.signedAt}</div>
                  <div><strong>Versión legal:</strong> {client.contract.contractVersion}</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSign} className="space-y-3">
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedClauses.rgpd}
                      onChange={e => setAcceptedClauses({ ...acceptedClauses, rgpd: e.target.checked })}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      Acepto el <strong>Encargo de Tratamiento de Datos</strong> conforme al Art. 28 del RGPD y autorizo a RSG Gestudoc a procesar los albaranes y documentos del establecimiento.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedClauses.confidentiality}
                      onChange={e => setAcceptedClauses({ ...acceptedClauses, confidentiality: e.target.checked })}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      Acepto el <strong>Acuerdo de Confidencialidad y Secreto</strong> que prohíbe la divulgación o cesión de precios y datos a terceros.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedClauses.security}
                      onChange={e => setAcceptedClauses({ ...acceptedClauses, security: e.target.checked })}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      Reconozco las medidas de <strong>seguridad y aislamiento técnico de datos</strong> aplicadas por el sistema.
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Nombre y Apellidos del Firmante:</label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={e => setSignerName(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">NIF / CIF del Firmante:</label>
                    <input
                      type="text"
                      value={signerNif}
                      onChange={e => setSignerNif(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border rounded-xl hover:bg-slate-100 text-slate-600 font-medium"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={!canSign}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 ${
                      canSign
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Firmar Contrato y Conceder Permisos</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
