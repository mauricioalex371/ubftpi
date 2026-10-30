import React, { useState } from 'react';
import { Check, Send, ChevronRight, Shield, Users } from 'lucide-react';

// This page is shown when the URL contains ?ficha
// It reads academy info from URL params and sends the filled form via WhatsApp

interface FichaParams {
  academia: string;
  mestre: string;
  whatsapp: string; // master's phone number
  modalidade?: string;
}

function readParams(): FichaParams {
  const p = new URLSearchParams(window.location.search);
  return {
    academia: p.get('academia') || 'Academia',
    mestre: p.get('mestre') || 'Professor',
    whatsapp: p.get('wa') || '',
    modalidade: p.get('mod') || '',
  };
}

export const FichaPublica: React.FC = () => {
  const params = readParams();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);

  // Form fields
  const [nome, setNome] = useState('');
  const [celular, setCelular] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [modalidades, setModalidades] = useState<string[]>(params.modalidade ? [params.modalidade] : []);
  const [isMinor, setIsMinor] = useState(false);
  const [responsavel, setResponsavel] = useState('');
  const [celularResp, setCelularResp] = useState('');
  const [contatoEmerg, setContatoEmerg] = useState('');
  const [celularEmerg, setCelularEmerg] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [concordaLgpd, setConcordaLgpd] = useState(false);

  const MODALIDADES = ['Jiu-Jitsu', 'Muay Thai', 'Funcional', 'MMA', 'Boxe'];

  const toggleModalidade = (m: string) =>
    setModalidades((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);

  const handleSubmit = () => {
    if (!concordaLgpd) {
      alert('Por favor, aceite os termos para continuar.');
      return;
    }

    // Build the student data object to be imported by the master
    const studentData = {
      nome,
      celular,
      nascimento,
      endereco,
      modalidades,
      responsavel: isMinor ? responsavel : '',
      celularResp: isMinor ? celularResp : '',
      contatoEmerg,
      celularEmerg,
      observacoes,
    };

    // Encode student data as base64 to pass via URL
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(studentData))));
    const importUrl = `${window.location.origin}${window.location.pathname}?importar=${encoded}`;

    // Build WhatsApp message — use simple line breaks (no \n in template)
    const msg = [
      `📋 FICHA DE CADASTRO — ${params.academia.toUpperCase()}`,
      ``,
      `👤 Dados Pessoais`,
      `Nome: ${nome}`,
      `Celular: ${celular}`,
      `Nascimento: ${nascimento}`,
      `Endereço: ${endereco}`,
      `Modalidade(s): ${modalidades.join(', ')}`,
      ...(isMinor ? [``, `👨‍👩‍👧 Responsável`, `Nome: ${responsavel}`, `Celular: ${celularResp}`] : []),
      ``,
      `🚨 Contato de Emergência`,
      `Nome: ${contatoEmerg}`,
      `Celular: ${celularEmerg}`,
      ...(observacoes ? [``, `📝 Observações`, observacoes] : []),
      ``,
      `✅ LGPD: aceito`,
      ``,
      `📲 Clique para salvar no app:`,
      importUrl,
    ].join('\n');

    const cleanPhone = params.whatsapp.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-[#10B981]" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Ficha enviada!</h2>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Seus dados foram enviados para a {params.academia} via WhatsApp.
            <br /><br />
            O professor entrará em contato para confirmar sua matrícula.
          </p>
          <p className="text-xs text-[#6B7280] mt-6">Pode fechar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F9FAFB] font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#050505] border-b border-[#272424] px-4 py-3 safe-area-top">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#FF4A0F] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-black text-white">{params.academia}</p>
            <p className="text-[10px] text-[#9CA3AF]">Ficha de Cadastro — {params.mestre}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 pb-20 space-y-6">

        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step === s ? 'bg-[#FF4A0F] text-white' : step > s ? 'bg-[#10B981] text-black' : 'bg-[#131212] border border-[#272424] text-[#6B7280]'
              }`}>
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-[#10B981]' : 'bg-[#272424]'}`} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Dados pessoais ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-black text-white">Dados Pessoais</h2>
              <p className="text-xs text-[#9CA3AF]">Preencha seus dados para se cadastrar na academia.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full min-h-[48px] px-4 rounded-xl bg-[#131212] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Celular / WhatsApp *</label>
                  <input
                    type="tel"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    placeholder="(21) 99999-9999"
                    className="w-full min-h-[48px] px-3 rounded-xl bg-[#131212] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Data de Nascimento *</label>
                  <input
                    type="text"
                    value={nascimento}
                    onChange={(e) => setNascimento(e.target.value)}
                    placeholder="dd/mm/aaaa"
                    className="w-full min-h-[48px] px-3 rounded-xl bg-[#131212] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Endereço *</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                  className="w-full min-h-[48px] px-4 rounded-xl bg-[#131212] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5">
                  Modalidade(s) *{' '}
                  <span className="font-normal text-[#6B7280]">(pode escolher mais de uma)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {MODALIDADES.map((m) => {
                    const selected = modalidades.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleModalidade(m)}
                        className={`min-h-[40px] px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                          selected
                            ? 'bg-[#FF4A0F] text-white'
                            : 'bg-[#131212] text-[#9CA3AF] border border-[#272424]'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5" />}
                        {m}
                      </button>
                    );
                  })}
                </div>
                {modalidades.length === 0 && (
                  <p className="text-[11px] text-[#EF4444] mt-1">Selecione ao menos uma modalidade</p>
                )}
              </div>

              {/* Menor de idade */}
              <div className="p-4 rounded-xl bg-[#131212] border border-[#272424]">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMinor}
                    onChange={(e) => setIsMinor(e.target.checked)}
                    className="w-5 h-5 accent-[#FF4A0F] rounded"
                  />
                  <span className="text-sm font-bold text-white">Sou menor de 18 anos</span>
                </label>

                {isMinor && (
                  <div className="mt-3 space-y-3 pt-3 border-t border-[#272424]">
                    <div>
                      <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Nome do Responsável *</label>
                      <input
                        type="text"
                        value={responsavel}
                        onChange={(e) => setResponsavel(e.target.value)}
                        placeholder="Pai, mãe ou tutor"
                        className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Celular do Responsável *</label>
                      <input
                        type="tel"
                        value={celularResp}
                        onChange={(e) => setCelularResp(e.target.value)}
                        placeholder="(21) 99999-9999"
                        className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                if (!nome.trim() || !celular.trim() || !nascimento.trim() || !endereco.trim() || modalidades.length === 0) {
                  alert('Preencha todos os campos obrigatórios (*) e selecione ao menos uma modalidade.');
                  return;
                }
                setStep(2);
              }}
              className="w-full min-h-[52px] rounded-xl bg-[#FF4A0F] text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#FF4A0F]/20"
            >
              <span>Próximo</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ── Step 2: Emergência + Observações ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-black text-white">Contato de Emergência</h2>
              <p className="text-xs text-[#9CA3AF]">Quem devemos chamar em caso de emergência?</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Nome *</label>
                <input
                  type="text"
                  value={contatoEmerg}
                  onChange={(e) => setContatoEmerg(e.target.value)}
                  placeholder="Nome e parentesco (ex: Maria - Mãe)"
                  className="w-full min-h-[48px] px-4 rounded-xl bg-[#131212] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Celular *</label>
                <input
                  type="tel"
                  value={celularEmerg}
                  onChange={(e) => setCelularEmerg(e.target.value)}
                  placeholder="(21) 99999-9999"
                  className="w-full min-h-[48px] px-4 rounded-xl bg-[#131212] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Observações médicas (opcional)</label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Lesões, alergias, limitações físicas, medicamentos em uso..."
                  className="w-full p-4 rounded-xl bg-[#131212] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="min-h-[52px] px-6 rounded-xl border border-[#272424] text-[#9CA3AF] font-bold text-sm active:scale-95"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  if (!contatoEmerg.trim() || !celularEmerg.trim()) {
                    alert('Preencha o contato de emergência.');
                    return;
                  }
                  setStep(3);
                }}
                className="flex-1 min-h-[52px] rounded-xl bg-[#FF4A0F] text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#FF4A0F]/20"
              >
                <span>Revisar</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Revisão + LGPD ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-black text-white">Revisar e Enviar</h2>
              <p className="text-xs text-[#9CA3AF]">Confirme seus dados antes de enviar.</p>
            </div>

            {/* Summary card */}
            <div className="bg-[#131212] border border-[#272424] rounded-2xl p-4 space-y-3 text-xs">
              <div>
                <p className="text-[#9CA3AF] mb-0.5">Nome</p>
                <p className="text-white font-bold">{nome}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[#9CA3AF] mb-0.5">Celular</p>
                  <p className="text-white font-bold">{celular}</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] mb-0.5">Nascimento</p>
                  <p className="text-white font-bold">{nascimento}</p>
                </div>
              </div>
              <div>
                <p className="text-[#9CA3AF] mb-0.5">Endereço</p>
                <p className="text-white font-bold">{endereco}</p>
              </div>
              <div>
                <p className="text-[#9CA3AF] mb-0.5">Modalidade(s)</p>
                <div className="flex flex-wrap gap-1">
                  {modalidades.map((m) => (
                    <span key={m} className="text-[#FF4A0F] font-bold bg-[#FF4A0F]/10 px-2 py-0.5 rounded-lg text-xs">{m}</span>
                  ))}
                </div>
              </div>
              {isMinor && (
                <div>
                  <p className="text-[#9CA3AF] mb-0.5">Responsável</p>
                  <p className="text-white font-bold">{responsavel} — {celularResp}</p>
                </div>
              )}
              <div className="pt-2 border-t border-[#272424]">
                <p className="text-[#9CA3AF] mb-0.5">Contato de Emergência</p>
                <p className="text-white font-bold">{contatoEmerg} — {celularEmerg}</p>
              </div>
              {observacoes && (
                <div>
                  <p className="text-[#9CA3AF] mb-0.5">Observações</p>
                  <p className="text-white">{observacoes}</p>
                </div>
              )}
            </div>

            {/* LGPD */}
            <div className="p-4 rounded-xl bg-[#131212] border border-[#272424]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={concordaLgpd}
                  onChange={(e) => setConcordaLgpd(e.target.checked)}
                  className="w-5 h-5 accent-[#FF4A0F] rounded mt-0.5 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-[#FF4A0F]" />
                    <span className="text-xs font-bold text-white">Consentimento LGPD</span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                    Autorizo a {params.academia} a armazenar e tratar meus dados pessoais exclusivamente para fins de gestão da minha matrícula, conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="min-h-[52px] px-6 rounded-xl border border-[#272424] text-[#9CA3AF] font-bold text-sm active:scale-95"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!concordaLgpd}
                className={`flex-1 min-h-[52px] rounded-xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-lg transition-all ${
                  concordaLgpd
                    ? 'bg-[#10B981] text-black shadow-[#10B981]/20'
                    : 'bg-[#272424] text-[#6B7280] cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
                <span>Enviar pelo WhatsApp</span>
              </button>
            </div>

            <p className="text-[10px] text-[#6B7280] text-center">
              Ao clicar em "Enviar", o WhatsApp será aberto com seus dados para envio ao professor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
