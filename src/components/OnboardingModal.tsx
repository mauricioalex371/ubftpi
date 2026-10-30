import React, { useState } from 'react';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ClassEntity } from '../types';
import { generateUUID } from '../utils/formatters';

interface OnboardingModalProps {
  onComplete: (academyName: string, masterName: string, initialClass?: ClassEntity) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [academyName, setAcademyName] = useState('UBF Team Parque Indiano');
  const [masterName, setMasterName] = useState('Mestre Uarlei Silva');

  // Step 3: Primeira turma
  const [className, setClassName] = useState('Jiu-Jitsu Adulto Noite');
  const [modality, setModality] = useState('Jiu-Jitsu');
  const [days, setDays] = useState<string[]>(['Seg', 'Qua', 'Sex']);
  const [startTime, setStartTime] = useState('19:30');
  const [endTime, setEndTime] = useState('21:00');

  const toggleDay = (day: string) => {
    if (days.includes(day)) {
      setDays(days.filter((d) => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const handleFinish = () => {
    const initialClass: ClassEntity = {
      id: generateUUID(),
      name: className.trim() || 'Turma Principal',
      modality,
      level: 'Todos os Níveis',
      instructor: masterName,
      days: days.length > 0 ? days : ['Seg', 'Qua', 'Sex'],
      startTime,
      endTime,
      maxCapacity: 30,
    };

    onComplete(academyName.trim() || 'UBF Team', masterName.trim() || 'Mestre', initialClass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#131212] border border-[#272424] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#1a1818] border border-[#FF4A0F] flex items-center justify-center">
            <img src="/icon.png" alt="UBF Team" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white leading-tight">Configuração Inicial</h2>
            <p className="text-xs text-[#9CA3AF]">Passo {step} de 3 • Rápido e prático</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                Nome da Academia
              </label>
              <input
                type="text"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                placeholder="Ex: UBF Team Parque Indiano"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#050505] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
              />
            </div>
            <p className="text-xs text-[#6B7280]">
              Este nome aparecerá nos cabeçalhos, relatórios e mensagens de cobrança pelo WhatsApp.
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full min-h-[46px] rounded-xl bg-[#FF4A0F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#ff3b00] active:scale-95 transition-all mt-6 shadow-lg shadow-[#FF4A0F]/20"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                Nome do Mestre / Administrador
              </label>
              <input
                type="text"
                value={masterName}
                onChange={(e) => setMasterName(e.target.value)}
                placeholder="Ex: Mestre Uarlei Silva"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#050505] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
              />
            </div>
            <p className="text-xs text-[#6B7280]">
              Será atribuído como instrutor principal das turmas e nas assinaturas de comunicados.
            </p>
            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setStep(1)}
                className="min-h-[46px] px-4 rounded-xl border border-[#272424] text-[#9CA3AF] text-sm font-semibold hover:text-white"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 min-h-[46px] rounded-xl bg-[#FF4A0F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#ff3b00] active:scale-95 transition-all shadow-lg shadow-[#FF4A0F]/20"
              >
                <span>Avançar para Primeira Turma</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                Nome da Primeira Turma
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Ex: Jiu-Jitsu Adulto Noite"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#050505] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Modalidade</label>
                <select
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
                >
                  <option value="Jiu-Jitsu">Jiu-Jitsu</option>
                  <option value="Muay Thai">Muay Thai</option>
                  <option value="MMA">MMA</option>
                  <option value="Boxe">Boxe</option>
                  <option value="Funcional">Funcional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Horário Início</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5">
                Dias de Treino
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => {
                  const isSelected = days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`min-w-[44px] min-h-[38px] px-2.5 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#FF4A0F] text-white'
                          : 'bg-[#050505] text-[#9CA3AF] border border-[#272424]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full min-h-[48px] rounded-xl bg-[#FF4A0F] text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-[#ff3b00] active:scale-95 transition-all mt-6 shadow-lg shadow-[#FF4A0F]/20"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Concluir e Abrir Academia</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
