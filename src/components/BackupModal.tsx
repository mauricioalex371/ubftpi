import React, { useState } from 'react';
import { X, Share2, Upload, HardDrive, Lock, Check, ShieldCheck, Key, User } from 'lucide-react';
import { exportDatabaseJSON, importDatabaseJSON, requestPersistentStorage } from '../db/indexedDB';
import { AppSettings } from '../types';

interface BackupModalProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClose: () => void;
  onDataRestored: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
  onDataRestored,
}) => {
  const [pinInput, setPinInput] = useState(settings.pinCode || '');
  const [pinEnabled, setPinEnabled] = useState(!!settings.pinCode);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Academy settings
  const [academyName, setAcademyName] = useState(settings.academyName);
  const [masterName, setMasterName] = useState(settings.masterName);
  const [masterPhone, setMasterPhone] = useState(settings.masterPhone || '');
  const [pixKey, setPixKey] = useState(settings.pixKey || '');

  const handleSaveAcademyInfo = () => {
    if (!academyName.trim() || !masterName.trim()) {
      alert('Nome da academia e do mestre são obrigatórios.');
      return;
    }
    onSaveSettings({ ...settings, academyName: academyName.trim(), masterName: masterName.trim(), masterPhone: masterPhone.trim(), pixKey: pixKey.trim() });
    setStatusMessage('Informações da academia salvas!');
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const json = await exportDatabaseJSON();
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `backup_ubf_team_${dateStr}.json`;

      const file = new File([json], fileName, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Backup UBF Team Gestão',
          text: `Backup dos dados da academia realizado em ${new Date().toLocaleDateString('pt-BR')}`,
        });
      } else {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      onSaveSettings({ ...settings, lastBackupDate: new Date().toISOString() });
      setStatusMessage('Backup exportado com sucesso!');
    } catch (err: any) {
      if (err.name !== 'AbortError') setStatusMessage('Erro ao exportar backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Atenção: a restauração substituirá todos os dados locais. Deseja continuar?')) return;
    try {
      setIsImporting(true);
      const text = await file.text();
      const success = await importDatabaseJSON(text);
      if (success) {
        setStatusMessage('Backup restaurado com sucesso!');
        onDataRestored();
      } else {
        setStatusMessage('Arquivo de backup inválido.');
      }
    } catch {
      setStatusMessage('Erro ao ler arquivo.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleSavePin = () => {
    if (pinEnabled) {
      if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
        alert('O PIN deve conter exatamente 4 números.');
        return;
      }
      onSaveSettings({ ...settings, pinCode: pinInput });
      setStatusMessage('PIN de segurança salvo!');
    } else {
      onSaveSettings({ ...settings, pinCode: undefined });
      setStatusMessage('PIN desativado.');
    }
  };

  const handleRequestPersist = async () => {
    const result = await requestPersistentStorage();
    setStatusMessage(
      result
        ? 'Armazenamento persistente ativado!'
        : 'O navegador controla a persistência automaticamente.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#131212] border border-[#272424] rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#272424] mb-4">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-[#FF4A0F]" />
            <h2 className="text-base font-bold text-white">Configurações e Backup</h2>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CA3AF] hover:text-white"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div className="p-3 mb-4 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 text-xs text-[#10B981] font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Academia Info */}
          <div className="bg-[#1a1818] p-4 rounded-xl border border-[#272424] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF4A0F] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Informações da Academia
            </h3>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Nome da Academia</label>
              <input
                type="text"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                className="w-full min-h-[40px] px-3 rounded-lg bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Nome do Mestre / Professor</label>
              <input
                type="text"
                value={masterName}
                onChange={(e) => setMasterName(e.target.value)}
                className="w-full min-h-[40px] px-3 rounded-lg bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">WhatsApp do Professor (para receber fichas)</label>
              <input
                type="tel"
                value={masterPhone}
                onChange={(e) => setMasterPhone(e.target.value)}
                placeholder="21988887777"
                className="w-full min-h-[40px] px-3 rounded-lg bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1 flex items-center gap-1">
                <Key className="w-3 h-3" /> Chave Pix (para cobranças automáticas)
              </label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, CNPJ, email ou chave aleatória"
                className="w-full min-h-[40px] px-3 rounded-lg bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
              />
            </div>
            <button
              onClick={handleSaveAcademyInfo}
              className="w-full min-h-[40px] rounded-lg bg-[#FF4A0F] text-white font-bold text-xs hover:bg-[#ff3b00] active:scale-95 transition-all"
            >
              Salvar Informações
            </button>
          </div>

          {/* Export / Import */}
          <div className="bg-[#1a1818] p-4 rounded-xl border border-[#272424]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF4A0F] mb-1">
              Backup de Dados
            </h3>
            <p className="text-xs text-[#9CA3AF] mb-3 leading-relaxed">
              Exporte uma cópia de todos os dados para não perder nada.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full min-h-[44px] px-4 rounded-xl bg-[#FF4A0F] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#ff3b00] active:scale-95 transition-all shadow-md shadow-[#FF4A0F]/20"
              >
                <Share2 className="w-4 h-4" />
                <span>{isExporting ? 'Exportando...' : 'Exportar Backup'}</span>
              </button>
              <label className="w-full min-h-[44px] px-4 rounded-xl bg-[#050505] border border-[#272424] text-white font-semibold text-xs flex items-center justify-center gap-2 hover:border-[#FF4A0F] active:scale-95 transition-all cursor-pointer">
                <Upload className="w-4 h-4 text-[#9CA3AF]" />
                <span>{isImporting ? 'Importando...' : 'Restaurar Backup'}</span>
                <input type="file" accept=".json,application/json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>
            {settings.lastBackupDate && (
              <p className="text-[11px] text-[#6B7280] mt-2.5">
                Último backup: {new Date(settings.lastBackupDate).toLocaleDateString('pt-BR')} às{' '}
                {new Date(settings.lastBackupDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {/* Storage Persistence */}
          <div className="bg-[#1a1818] p-4 rounded-xl border border-[#272424]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Persistência iOS</h3>
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            </div>
            <p className="text-xs text-[#9CA3AF] mb-3 leading-relaxed">
              Evita que o iOS Safari limpe os dados em caso de pouco espaço no dispositivo.
            </p>
            <button
              onClick={handleRequestPersist}
              className="w-full min-h-[44px] px-4 rounded-xl bg-[#050505] border border-[#272424] text-white font-semibold text-xs hover:border-[#10B981] active:scale-95 transition-all"
            >
              Ativar Armazenamento Persistente
            </button>
          </div>

          {/* PIN */}
          <div className="bg-[#1a1818] p-4 rounded-xl border border-[#272424]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#FF4A0F]" />
                <span>Proteção por PIN</span>
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pinEnabled}
                  onChange={(e) => setPinEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#050505] border border-[#272424] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF4A0F]"></div>
              </label>
            </div>
            <p className="text-xs text-[#9CA3AF] mb-3 leading-relaxed">
              Exige uma senha de 4 dígitos ao abrir o app (LGPD).
            </p>
            {pinEnabled && (
              <div className="space-y-2 mt-3">
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="PIN com 4 dígitos"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#050505] border border-[#272424] text-white text-center font-mono text-lg tracking-widest focus:border-[#FF4A0F] focus:outline-none"
                />
                <button
                  onClick={handleSavePin}
                  className="w-full min-h-[44px] rounded-xl bg-[#FF4A0F] text-white font-bold text-xs hover:bg-[#ff3b00] active:scale-95 transition-all"
                >
                  Salvar PIN
                </button>
              </div>
            )}
            {!pinEnabled && settings.pinCode && (
              <button
                onClick={handleSavePin}
                className="w-full min-h-[40px] rounded-xl border border-[#EF4444]/40 text-[#EF4444] font-bold text-xs hover:bg-[#EF4444]/10 active:scale-95 transition-all"
              >
                Desativar PIN
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
