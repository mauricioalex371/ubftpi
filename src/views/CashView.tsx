import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CashTransaction, CashType } from '../types';
import { formatCurrency, getCurrentMonthYear, getTodayDateBR, generateUUID } from '../utils/formatters';
import { EmptyState } from '../components/EmptyState';

interface CashViewProps {
  transactions: CashTransaction[];
  onAddTransaction: (t: CashTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function stepMonth(my: string, delta: number): string {
  const [m, y] = my.split('/');
  let mm = parseInt(m, 10) + delta;
  let yy = parseInt(y, 10);
  if (mm > 12) { mm = 1; yy++; }
  if (mm < 1)  { mm = 12; yy--; }
  return `${String(mm).padStart(2, '0')}/${yy}`;
}
function monthLabel(my: string): string {
  const [m, y] = my.split('/');
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

export const CashView: React.FC<CashViewProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const currentMonthYear = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear);
  const [filterType, setFilterType] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [type, setType] = useState<CashType>('SAIDA');
  const [category, setCategory] = useState('Aluguel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('PIX');

  // Filter by selected month
  const monthTransactions = transactions.filter((t) => t.date.endsWith(selectedMonth));

  const totalIncome  = monthTransactions.filter((t) => t.type === 'ENTRADA').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = monthTransactions.filter((t) => t.type === 'SAIDA').reduce((acc, t) => acc + t.amount, 0);
  const monthBalance = totalIncome - totalExpense;

  const filteredTransactions = monthTransactions
    .filter((t) => filterType === 'TODOS' || t.type === filterType)
    .sort((a, b) => {
      // Sort by date desc, then createdAt desc
      const dateCompare = b.date.split('/').reverse().join('').localeCompare(
        a.date.split('/').reverse().join('')
      );
      if (dateCompare !== 0) return dateCompare;
      return b.createdAt - a.createdAt;
    });

  const handleOpenModal = (presetType: CashType = 'SAIDA') => {
    setType(presetType);
    setCategory(presetType === 'SAIDA' ? 'Aluguel' : 'Venda de Kimonos e Produtos');
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('PIX');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0 || !description.trim()) return;

    // Convert yyyy-mm-dd → dd/mm/yyyy
    const [y, m, d] = date.split('-');
    const dateBR = d && m && y ? `${d}/${m}/${y}` : getTodayDateBR();

    const newTx: CashTransaction = {
      id: generateUUID(),
      type,
      category,
      description: description.trim(),
      amount: val,
      date: dateBR,
      paymentMethod,
      createdAt: Date.now(),
    };

    onAddTransaction(newTx);
    setIsModalOpen(false);
  };

  const expenseCategories = [
    'Aluguel',
    'Água, Luz e Internet',
    'Pagamento de Professores',
    'Material e Limpeza Tatame',
    'Manutenção e Reparos',
    'Impostos e Tarifas',
    'Outras Despesas',
  ];

  const incomeCategories = [
    'Mensalidades',
    'Matrículas',
    'Aulas Experimentais',
    'Aulas Particulares',
    'Venda de Kimonos e Produtos',
    'Outras Receitas',
  ];

  return (
    <div className="space-y-4 pb-20">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Caixa & Financeiro</h2>
          <p className="text-xs text-[#9CA3AF]">Fluxo financeiro da academia</p>
        </div>
        <button
          onClick={() => handleOpenModal('SAIDA')}
          className="min-h-[44px] px-4 rounded-xl bg-[#FF4A0F] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#ff3b00] active:scale-95 transition-all shadow-md shadow-[#FF4A0F]/20"
        >
          <Plus className="w-4 h-4" />
          <span>Lançamento</span>
        </button>
      </div>

      {/* ── Navegação de mês ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-[#131212] border border-[#272424] rounded-2xl p-1">
        <button
          onClick={() => setSelectedMonth((m) => stepMonth(m, -1))}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CA3AF] hover:text-white active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-black text-white">{monthLabel(selectedMonth)}</p>
          <p className="text-[10px] text-[#9CA3AF]">{monthTransactions.length} lançamento{monthTransactions.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setSelectedMonth((m) => stepMonth(m, 1))}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CA3AF] hover:text-white active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── Resumo do mês ─────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#131212] border border-[#272424] shadow-lg">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
          Saldo — {monthLabel(selectedMonth)}
        </span>
        <p className={`text-2xl font-black mt-1 ${monthBalance >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
          {formatCurrency(monthBalance)}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#272424]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-[#9CA3AF]">Entradas</p>
              <p className="text-xs font-bold text-[#10B981]">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-[#9CA3AF]">Saídas</p>
              <p className="text-xs font-bold text-[#EF4444]">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filtros por tipo ───────────────────────────────────────────────── */}
      <div className="flex bg-[#131212] p-1 rounded-xl border border-[#272424]">
        {([
          ['TODOS',   `Todos (${monthTransactions.length})`],
          ['ENTRADA', `Entradas (${monthTransactions.filter((t) => t.type === 'ENTRADA').length})`],
          ['SAIDA',   `Saídas (${monthTransactions.filter((t) => t.type === 'SAIDA').length})`],
        ] as [typeof filterType, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            className={`flex-1 min-h-[38px] rounded-lg text-xs font-bold transition-all ${
              filterType === key
                ? key === 'ENTRADA' ? 'bg-[#10B981] text-black shadow-md'
                  : key === 'SAIDA' ? 'bg-[#EF4444] text-white shadow-md'
                  : 'bg-[#FF4A0F] text-white shadow-md'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={monthTransactions.length === 0 ? 'Nenhum lançamento neste mês' : 'Sem lançamentos neste filtro'}
          description={
            monthTransactions.length === 0
              ? 'Registre despesas e receitas para acompanhar as finanças deste mês.'
              : 'Nenhum lançamento no filtro selecionado.'
          }
          actionLabel={monthTransactions.length === 0 ? 'Novo Lançamento' : undefined}
          onAction={monthTransactions.length === 0 ? () => handleOpenModal('SAIDA') : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'ENTRADA';
            const isFromFee = !!tx.feeId;
            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-[#131212] border border-[#272424] flex items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isIncome ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#EF4444]/15 text-[#EF4444]'
                  }`}>
                    {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white truncate">{tx.description}</h4>
                      {isFromFee && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FF4A0F]/15 text-[#FF4A0F] border border-[#FF4A0F]/30 shrink-0">
                          mensalidade
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {tx.category} • {tx.date} • {tx.paymentMethod}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-black ${isIncome ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                  <button
                    onClick={() => {
                      const msg = isFromFee
                        ? 'Este lançamento veio de um pagamento de mensalidade. Ao excluir, a mensalidade NÃO voltará para Pendente automaticamente — use o botão de estorno na aba Mensalidades. Deseja excluir mesmo assim?'
                        : `Excluir "${tx.description}"?`;
                      if (confirm(msg)) onDeleteTransaction(tx.id);
                    }}
                    className="text-[#6B7280] hover:text-[#EF4444] p-1.5"
                    title="Excluir lançamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Novo Lançamento ─────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#131212] border border-[#272424] rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#272424] mb-4">
              <h3 className="text-base font-bold text-white">Novo Lançamento</h3>
              <button onClick={() => setIsModalOpen(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CA3AF] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setType('SAIDA'); setCategory('Aluguel'); }}
                  className={`min-h-[42px] rounded-xl text-xs font-bold transition-all ${
                    type === 'SAIDA' ? 'bg-[#EF4444] text-white shadow-md' : 'bg-[#050505] text-[#9CA3AF] border border-[#272424]'
                  }`}
                >
                  Despesa (Saída)
                </button>
                <button
                  type="button"
                  onClick={() => { setType('ENTRADA'); setCategory('Outras Receitas'); }}
                  className={`min-h-[42px] rounded-xl text-xs font-bold transition-all ${
                    type === 'ENTRADA' ? 'bg-[#10B981] text-black shadow-md' : 'bg-[#050505] text-[#9CA3AF] border border-[#272424]'
                  }`}
                >
                  Receita (Entrada)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Descrição *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Aluguel do galpão, Taxa exame faixa..."
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#050505] border border-[#272424] text-white text-base font-bold focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                >
                  {(type === 'SAIDA' ? expenseCategories : incomeCategories).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  >
                    <option value="PIX">PIX</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CARTAO">Cartão</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-[#FF4A0F] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#ff3b00] active:scale-95 shadow-md shadow-[#FF4A0F]/20 mt-2"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Lançamento</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
