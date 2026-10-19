import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle, Building2, KeyRound } from 'lucide-react';

interface ClientLoginProps {
  clients: Client[];
  onLoginSuccess: (client: Client) => void;
  onSwitchToAdmin: () => void;
  initialAccessId?: string;
}

export const ClientLogin: React.FC<ClientLoginProps> = ({
  clients,
  onLoginSuccess,
  onSwitchToAdmin,
  initialAccessId = ''
}) => {
  const [accessId, setAccessId] = useState(initialAccessId);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  useEffect(() => {
    if (initialAccessId) {
      setAccessId(initialAccessId);
    }
  }, [initialAccessId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = accessId.trim().toLowerCase();
    const cleanPass = password.trim();

    // Comprobar coincidencia por accessId, internalCode o CIF
    const found = clients.find(c => 
      (c.accessId.toLowerCase() === cleanId || 
       c.internalCode.toLowerCase() === cleanId ||
       c.nif.toLowerCase() === cleanId) &&
      c.accessPassword === cleanPass
    );

    if (found) {
      if (found.status === 'INACTIVE') {
        setErrorMsg('Esta cuenta de cliente se encuentra desactivada por la oficina central.');
        return;
      }
      onLoginSuccess(found);
    } else {
      setErrorMsg('Identificador o contraseña incorrectos. Por favor, revisa tus credenciales.');
    }
  };

  const fillQuickDemo = (client: Client) => {
    setAccessId(client.accessId);
    setPassword(client.accessPassword);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Cabecera del formulario */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white text-center space-y-2">
          <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto border border-white/20 shadow-inner">
            <Lock className="w-6 h-6 text-emerald-300" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Portal Cliente Privado</h2>
          <p className="text-xs text-emerald-100 max-w-xs mx-auto">
            Acceso exclusivo para establecimientos autorizados. Introduce tus credenciales personales para enviar y consultar tus albaranes.
          </p>
        </div>

        {/* Formulario */}
        <div className="p-6 space-y-5">
          {initialAccessId && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Acceso directo para cliente: <strong>{initialAccessId}</strong>. Introduce tu contraseña.</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Identificador de Cliente o CIF</span>
              </label>
              <input
                type="text"
                value={accessId}
                onChange={e => setAccessId(e.target.value)}
                placeholder="Ej: fogon o CLI-001"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>Contraseña Privada</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus={Boolean(initialAccessId)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>Acceder a mi Espacio Privado</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Ayuda y acceso rápido para pruebas del propietario */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="w-full text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium py-1"
            >
              {showDemoCredentials ? 'Ocultar claves de prueba' : 'Ver claves de prueba de los clientes'}
            </button>

            {showDemoCredentials && (
              <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                <p className="font-semibold text-slate-700">Pulsa en cualquiera para rellenar automáticamente:</p>
                <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-slate-100">
                  {clients.slice(0, 8).map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => fillQuickDemo(c)}
                      className="py-1 px-1.5 hover:bg-emerald-50 rounded cursor-pointer flex justify-between items-center text-slate-600"
                    >
                      <span className="font-medium text-slate-800">{c.commercialName}</span>
                      <span className="font-mono text-emerald-700">{c.accessId} / {c.accessPassword}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pie con enlace a oficina */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Conexión encriptada
          </span>
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="text-slate-600 hover:text-slate-900 font-semibold underline"
          >
            Ir a Panel de Oficina
          </button>
        </div>
      </div>
    </div>
  );
};
