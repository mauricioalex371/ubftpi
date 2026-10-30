import React, { useState, useMemo } from 'react';
import {
  CreditCard, Send, Check, Search, X, AlertCircle, CheckCircle2,
  RefreshCw, RotateCcw, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { MonthlyFee, Student } from '../types';
import { formatCurrency, generateWhatsAppUrl, getCurrentMonthYear } from '../utils/formatters';
import { EmptyState } from '../components/EmptyState';

interface FeesViewProps {
  fees: MonthlyFee[];
  students: Student[];
  academyName: string;
  pixKey?: string;
  onRegisterPayment: (
    fee: MonthlyFee,
    amountPaid: number,
    method: 'PIX' | 'DINHEIRO' | 'CARTAO' | 'OUTRO',
    notes?: string
  ) => void;
  onRevertPayment: (fee: MonthlyFee) => void;
  onGenerateMonthFees: (monthYear?: string) => void;
}

// Helper: parse mm/yyyy → { m, y } numbers for navigation
function parseMonthYear(my: string): { m: number; y: number } {
  const [m, y] = my.split('/');
  return { m: parseInt(m, 10), y: parseInt(y, 10) };
}
function formatMonthYear(m: number, y: number): string {
  return `${String(m).padStart(2, '0')}/${y}`;
}
function stepMonth(my: string, delta: number): string {
  let { m, y } = parseMonthYear(my);
  m += delta;
  if (m > 12) { m = 1; y++; }
  if (m < 1)  { m = 12; y--; }
  return formatMonthYear(m, y);
}
const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
function monthLabel(my: string): string {
  const { m, y } = parseMonthYear(my);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export const FeesView: React.FC<FeesViewProps> = ({
  fees,
  students,
  academyName,
  pixKey,
  onRegisterPayment,
  onRevertPayment,
  onGenerateMonthFees,
}) => {
  const currentMonthYear = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear);
  const [filter, setFilter] = useState<'TODOS' | 'ATRASADO' | 'PENDENTE' | 'PAGO'>('TODOS');
  const [search, setSearch] = useState('');
  const [payingFee, setPayingFee] = useState<MonthlyFee | null>(null);
  const [confirmRevert, setConfirmRevert] = useState<MonthlyFee | null>(null);

  // Payment modal state
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'DINHEIRO' | 'CARTAO' | 'OUTRO'>('PIX');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Months that have fees — for navigation hints
  const availableMonths = useMemo(() => {
    const set = new Set(fees.map((f) => f.monthYear));
    if (!set.has(currentMonthYear)) set.add(currentMonthYear);
    return Array.from(set).sort();
  }, [fees, currentMonthYear]);

  // Fees for selected month
  const monthFees = fees.filter((f) => f.monthYear === selectedMonth);

  const filteredFees = monthFees.filter((f) => {
    const matchesFilter = filter === 'TODOS' || f.status === filter;
    const matchesSearch = f.studentName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Sorted: ATRASADO first, then PENDENTE, then PAGO; alphabetical within group
  const sortedFees = [...filteredFees].sort((a, b) => {
    const order = { ATRASADO: 0, PENDENTE: 1, PAGO: 2 };
    const diff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
    if (diff !== 0) return diff;
    return a.studentName.localeCompare(b.studentName, 'pt-BR');
  });

  const totalOverdue = monthFees.filter((f) => f.status === 'ATRASADO').reduce((acc, f) => acc + f.amount, 0);
  const totalPending = monthFees.filter((f) => f.status === 'PENDENTE').reduce((acc, f) => acc + f.amount, 0);
  const totalPaid    = monthFees.filter((f) => f.status === 'PAGO').reduce((acc, f) => acc + f.amountPaid, 0);

  const hasFeesThisMonth = monthFees.length > 0;

  const handleOpenPayment = (fee: MonthlyFee) => {
    setPayingFee(fee);
    setAmountPaid(fee.amount.toString());
    setPaymentMethod('PIX');
    setPaymentNotes('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingFee) return;
    const paidVal = parseFloat(amountPaid) || payingFee.amount;
    onRegisterPayment(payingFee, paidVal, paymentMethod, paymentNotes);
    setPayingFee(null);
  };

  return (
    <div className="space-y-4 pb-20">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Mensalidades</h2>
          <p className="text-xs text-[#9CA3AF]">Cobranças e pagamentos</p>
        </div>
        <button
          onClick={() => onGenerateMonthFees(selectedMonth)}
          className="min-h-[44px] px-3.5 rounded-xl bg-[#131212] border border-[#272424] text-white font-bold text-xs flex items-center gap-1.5 hover:border-[#FF4A0F] active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#FF4A0F]" />
          <span>Gerar mês</span>
        </button>
      </div>

      {/* ── Navegação de mês ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-[#131212] border border-[#272424] rounded-2xl p-1">
        <button
          onClick={() => setSelectedMonth((m) => stepMonth(m, -1))}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CA3AF] hover:text-white active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-black text-white">{monthLabel(selectedMonth)}</p>
          <p className="text-[10px] text-[#9CA3AF]">
            {monthFees.length} mensalidade{monthFees.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setSelectedMonth((m) => stepMonth(m, 1))}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CA3AF] hover:text-white active:scale-95 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── Resumo do mês ──────────────────────────────────────────────────── */}
      {hasFeesThisMonth && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-center">
              <p className="text-[10px] text-[#EF4444] font-bold uppercase mb-1">Atrasado</p>
              <p className="text-sm font-black text-[#EF4444]">{formatCurrency(totalOverdue)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-center">
              <p className="text-[10px] text-[#F59E0B] font-bold uppercase mb-1">A Vencer</p>
              <p className="text-sm font-black text-[#F59E0B]">{formatCurrency(totalPending)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-center">
              <p className="text-[10px] text-[#10B981] font-bold uppercase mb-1">Recebido</p>
              <p className="text-sm font-black text-[#10B981]">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
          {/* Cobrança em massa */}
          {monthFees.filter((f) => f.status === 'ATRASADO').length > 0 && (
            <button
              onClick={() => {
                const overdue = monthFees.filter((f) => f.status === 'ATRASADO');
                const msgs = overdue.map((fee) => {
                  const student = students.find((s) => s.id === fee.studentId);
                  if (!student?.phone) return null;
                  const clean = student.phone.replace(/\D/g, '');
                  const phone = clean.startsWith('55') ? clean : `55${clean}`;
                  const text = encodeURIComponent(
                    `Olá ${student.name}! Sua mensalidade de ${formatCurrency(fee.amount)} (${fee.monthYear}) vence em ${fee.dueDate}.${pixKey ? ` Pix: ${pixKey}` : ''} Qualquer dúvida é só falar! Oss! — ${academyName}`
                  );
                  return `https://wa.me/${phone}?text=${text}`;
                }).filter(Boolean);

                if (msgs.length === 0) { alert('Nenhum aluno atrasado tem telefone cadastrado.'); return; }

                let i = 0;
                const openNext = () => {
                  if (i < msgs.length) {
                    window.open(msgs[i]!, '_blank');
                    i++;
                    if (i < msgs.length) setTimeout(openNext, 1500);
                  }
                };
                openNext();
              }}
              className="w-full min-h-[40px] rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Cobrar todos os atrasados ({monthFees.filter((f) => f.status === 'ATRASADO').length}) via WhatsApp</span>
            </button>
          )}
        </div>
      )}

      {/* ── Busca ──────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar aluno..."
          className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-[#131212] border border-[#272424] text-white text-xs placeholder:text-[#6B7280] focus:border-[#FF4A0F] focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Filtros ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {([
          ['TODOS',    `Todas (${monthFees.length})`],
          ['ATRASADO', `Atrasadas (${monthFees.filter((f) => f.status === 'ATRASADO').length})`],
          ['PENDENTE', `A Vencer (${monthFees.filter((f) => f.status === 'PENDENTE').length})`],
          ['PAGO',     `Pagas (${monthFees.filter((f) => f.status === 'PAGO').length})`],
        ] as [typeof filter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`min-h-[36px] px-3.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              filter === key
                ? 'bg-[#FF4A0F] text-white'
                : 'bg-[#131212] text-[#9CA3AF] border border-[#272424] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Lista ──────────────────────────────────────────────────────────── */}
      {!hasFeesThisMonth ? (
        <div className="p-5 rounded-2xl bg-[#131212] border border-[#272424] text-center">
          <CreditCard className="w-8 h-8 text-[#FF4A0F] mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white mb-1">Sem mensalidades em {monthLabel(selectedMonth)}</h4>
          <p className="text-xs text-[#9CA3AF] mb-4">
            Toque em "Gerar mês" para criar as cobranças de todos os alunos ativos para este mês.
          </p>
          <button
            onClick={() => onGenerateMonthFees(selectedMonth)}
            className="min-h-[44px] px-5 rounded-xl bg-[#FF4A0F] text-white font-bold text-xs inline-flex items-center gap-2 active:scale-95 shadow-md shadow-[#FF4A0F]/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Gerar mensalidades de {monthLabel(selectedMonth)}</span>
          </button>
        </div>
      ) : sortedFees.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhuma mensalidade neste filtro"
          description="Nenhum resultado para o filtro selecionado."
        />
      ) : (
        <div className="space-y-2.5">
          {sortedFees.map((fee) => {
            const student = students.find((s) => s.id === fee.studentId);
            const isPaid    = fee.status === 'PAGO';
            const isOverdue = fee.status === 'ATRASADO';

            return (
              <div
                key={fee.id}
                className={`p-3.5 rounded-2xl bg-[#131212] border transition-all shadow-md ${
                  isOverdue ? 'border-[#EF4444]/40' : isPaid ? 'border-[#10B981]/30' : 'border-[#272424]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white">{fee.studentName}</h3>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isPaid
                          ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                          : isOverdue
                          ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                          : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                      }`}>
                        {fee.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      Venc. {fee.dueDate}
                    </p>

                    <p className="text-sm font-black text-white mt-1">
                      {formatCurrency(fee.amount)}
                      {isPaid && fee.paymentMethod && (
                        <span className="text-xs text-[#10B981] font-semibold ml-2">
                          • {fee.paymentMethod} em {fee.paidDate}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* WhatsApp */}
                    {student?.phone && (
                      <a
                        href={generateWhatsAppUrl(
                          student.phone,
                          isPaid
                            ? `Olá ${student.name}! Confirmamos o recebimento da mensalidade de ${fee.monthYear} — ${formatCurrency(fee.amountPaid)}. Obrigado! Oss! — ${academyName}`
                            : `Olá ${student.name}! Sua mensalidade de ${formatCurrency(fee.amount)} (${fee.monthYear}) vence em ${fee.dueDate}.${pixKey ? ` Pix: ${pixKey}` : ''} Qualquer dúvida é só falar! Oss! — ${academyName}`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] active:scale-95"
                        title="WhatsApp"
                      >
                        <Send className="w-4 h-4" />
                      </a>
                    )}

                    {/* Receber / Estornar */}
                    {!isPaid ? (
                      <button
                        onClick={() => handleOpenPayment(fee)}
                        className="min-h-[38px] px-3.5 rounded-xl bg-[#FF4A0F] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#ff3b00] active:scale-95 shadow-md shadow-[#FF4A0F]/20"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Receber</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmRevert(fee)}
                        className="w-9 h-9 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] hover:bg-[#EF4444]/15 hover:text-[#EF4444] hover:border-[#EF4444]/30 active:scale-95 transition-all"
                        title="Estornar pagamento"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Registrar Pagamento ─────────────────────────────────────── */}
      {payingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#131212] border border-[#272424] rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#272424] mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Registrar Pagamento</h3>
                <p className="text-xs text-[#FF4A0F]">{payingFee.studentName} • {payingFee.monthYear}</p>
              </div>
              <button onClick={() => setPayingFee(null)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CA3AF] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Valor Recebido (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#050505] border border-[#272424] text-white text-base font-bold focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PIX', 'DINHEIRO', 'CARTAO', 'OUTRO'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`min-h-[40px] rounded-lg text-xs font-bold transition-all ${
                        paymentMethod === m ? 'bg-[#FF4A0F] text-white' : 'bg-[#050505] text-[#9CA3AF] border border-[#272424]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Observações</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Comprovante, desconto acordado..."
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-[#6B7280]">
                Valor entra automaticamente no Caixa como receita de mensalidade.
              </p>

              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-[#10B981] text-black font-black text-xs flex items-center justify-center gap-2 hover:bg-[#0ea372] active:scale-95 shadow-md shadow-[#10B981]/20"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Recebimento</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar Estorno ───────────────────────────────────────── */}
      {confirmRevert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-[#131212] border border-[#272424] rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#EF4444]/15 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Estornar Pagamento?</h3>
                <p className="text-xs text-[#9CA3AF]">{confirmRevert.studentName} • {confirmRevert.monthYear}</p>
              </div>
            </div>

            <p className="text-xs text-[#D1D5DB] mb-5 leading-relaxed">
              A mensalidade voltará para <span className="text-[#EF4444] font-bold">PENDENTE</span> e o lançamento de{' '}
              <span className="text-white font-bold">{formatCurrency(confirmRevert.amountPaid)}</span> no Caixa será removido.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmRevert(null)}
                className="flex-1 min-h-[44px] rounded-xl border border-[#272424] text-[#9CA3AF] text-xs font-bold hover:text-white active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onRevertPayment(confirmRevert);
                  setConfirmRevert(null);
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-[#EF4444] text-white font-bold text-xs hover:bg-[#dc2626] active:scale-95"
              >
                Sim, estornar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
