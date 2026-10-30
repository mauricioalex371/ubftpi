import React from 'react';
import { 
  Cake, 
  AlertTriangle, 
  Users, 
  Calendar, 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send, 
  PlusCircle, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Student, MonthlyFee, CashTransaction, ClassEntity, AppSettings } from '../types';
import { formatCurrency, isBirthdayThisWeek, isPast7Days, generateWhatsAppUrl, getCurrentMonthYear } from '../utils/formatters';

interface DashboardViewProps {
  students: Student[];
  fees: MonthlyFee[];
  cash: CashTransaction[];
  classes: ClassEntity[];
  settings: AppSettings;
  onNavigateTab: (tab: any) => void;
  onOpenBackup: () => void;
  onQuickAddStudent: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  fees,
  cash,
  classes,
  settings,
  onNavigateTab,
  onOpenBackup,
  onQuickAddStudent,
}) => {
  const { lastBackupDate, academyName, masterName, pixKey } = settings;
  const currentMonthYear = getCurrentMonthYear();
  const showBackupWarning = isPast7Days(lastBackupDate);

  // Active students
  const activeStudents = students.filter((s) => s.status === 'ATIVO');

  // Birthdays this week
  const birthdayStudents = students.filter((s) => s.birthDate && isBirthdayThisWeek(s.birthDate));

  // Current month financial calculations
  const currentMonthTransactions = cash.filter((c) => c.date.endsWith(currentMonthYear));
  const incomeThisMonth = currentMonthTransactions
    .filter((c) => c.type === 'ENTRADA')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expensesThisMonth = currentMonthTransactions
    .filter((c) => c.type === 'SAIDA')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balanceThisMonth = incomeThisMonth - expensesThisMonth;

  // Unpaid / Overdue fees
  const overdueFees = fees.filter((f) => f.status === 'ATRASADO');
  const pendingFees = fees.filter((f) => f.status === 'PENDENTE');

  return (
    <div className="space-y-4 pb-20">
      {/* Backup Alert if > 7 days or never */}
      {showBackupWarning && (
        <div 
          onClick={onOpenBackup}
          className="p-3.5 rounded-2xl bg-[#FF4A0F]/15 border border-[#FF4A0F]/50 flex items-center justify-between gap-3 cursor-pointer active:scale-98 transition-all shadow-md shadow-[#FF4A0F]/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FF4A0F] text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white leading-tight">
                {lastBackupDate ? 'Backup desatualizado (+7 dias)' : 'Nenhum backup realizado'}
              </h4>
              <p className="text-[11px] text-[#D1D5DB] mt-0.5">
                Toque aqui para exportar uma cópia de segurança dos alunos e caixa.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#FF4A0F] shrink-0">Exportar</span>
        </div>
      )}

      {/* Aniversariantes da Semana (Destaque para o Mestre) */}
      {birthdayStudents.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#131212] border border-[#FF4A0F]/40 shadow-lg">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Cake className="w-4 h-4 text-[#FF4A0F]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Aniversariantes da Semana ({birthdayStudents.length})
              </h3>
            </div>
            <span className="text-[10px] text-[#F59E0B] font-bold bg-[#F59E0B]/10 px-2 py-0.5 rounded-full border border-[#F59E0B]/30">
              Parabéns no tatame!
            </span>
          </div>

          <div className="space-y-2">
            {birthdayStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a1818] border border-[#272424]"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{student.name}</h4>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {student.birthDate} • {student.graduation} ({student.modalities?.join(', ') || student.modality || ''})
                  </p>
                </div>
                {student.phone && (
                  <a
                    href={generateWhatsAppUrl(
                      student.phone,
                      `Parabéns, ${student.name}! A família ${academyName} (${masterName}) deseja a você muita saúde, evolução e força dentro e fora dos tatames! Oss!`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[38px] px-3 rounded-lg bg-[#10B981] text-black font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Parabenizar</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Financial Result Card */}
      <div 
        onClick={() => onNavigateTab('caixa')}
        className="p-4 rounded-2xl bg-[#131212] border border-[#272424] hover:border-[#FF4A0F]/50 transition-all cursor-pointer shadow-lg"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            Resultado do Mês ({currentMonthYear})
          </span>
          <Wallet className="w-4 h-4 text-[#FF4A0F]" />
        </div>

        <div className="flex items-baseline justify-between">
          <span className={`text-2xl font-black ${balanceThisMonth >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {formatCurrency(balanceThisMonth)}
          </span>
          <span className="text-[11px] text-[#9CA3AF] font-medium">Ver extrato</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#272424]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] text-[#9CA3AF]">Entradas</p>
              <p className="text-xs font-bold text-[#10B981]">{formatCurrency(incomeThisMonth)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] text-[#9CA3AF]">Saídas</p>
              <p className="text-xs font-bold text-[#EF4444]">{formatCurrency(expensesThisMonth)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          onClick={() => onNavigateTab('alunos')}
          className="p-3.5 rounded-2xl bg-[#131212] border border-[#272424] cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">Alunos Ativos</span>
            <Users className="w-4 h-4 text-white" />
          </div>
          <p className="text-2xl font-black text-white">{activeStudents.length}</p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">Matriculados no tatame</p>
        </div>

        <div 
          onClick={() => onNavigateTab('mensalidades')}
          className="p-3.5 rounded-2xl bg-[#131212] border border-[#272424] cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">Atrasadas</span>
            <CreditCard className="w-4 h-4 text-[#EF4444]" />
          </div>
          <p className="text-2xl font-black text-[#EF4444]">{overdueFees.length}</p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">Cobranças pendentes</p>
        </div>
      </div>

      {/* Mensalidades em Atraso (Cobrança Rápida) */}
      {overdueFees.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#131212] border border-[#EF4444]/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#EF4444]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Cobrança Rápida ({overdueFees.length})
              </h3>
            </div>
            <button 
              onClick={() => onNavigateTab('mensalidades')}
              className="text-xs text-[#EF4444] font-bold"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-2">
            {overdueFees.slice(0, 3).map((fee) => {
              const student = students.find((s) => s.id === fee.studentId);
              return (
                <div
                  key={fee.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a1818] border border-[#272424]"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{fee.studentName}</h4>
                    <p className="text-[11px] text-[#EF4444]">
                      Venceu em {fee.dueDate} • {formatCurrency(fee.amount)}
                    </p>
                  </div>
                  {student?.phone && (
                    <a
                      href={generateWhatsAppUrl(
                        student.phone,
                        `Olá ${student.name}! Mensagem da ${academyName}: sua mensalidade de ${formatCurrency(fee.amount)} com vencimento em ${fee.dueDate} está pendente.${pixKey ? ` Chave Pix: ${pixKey}` : ''} Qualquer dúvida estamos à disposição! Oss!`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[38px] px-3 rounded-lg bg-[#EF4444]/20 border border-[#EF4444]/50 text-[#EF4444] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Cobrar</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aulas de Hoje */}
      <div className="p-4 rounded-2xl bg-[#131212] border border-[#272424]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FF4A0F]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              {(() => {
                const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
                const today = days[new Date().getDay()];
                const todayClasses = classes.filter((c) => c.days.includes(today));
                return todayClasses.length > 0
                  ? `Aulas de Hoje — ${today} (${todayClasses.length})`
                  : `Sem aulas hoje — ${today}`;
              })()}
            </h3>
          </div>
          <button onClick={() => onNavigateTab('turmas')} className="text-xs text-[#FF4A0F] font-bold">
            Ver grade
          </button>
        </div>

        {classes.length === 0 ? (
          <p className="text-xs text-[#9CA3AF] py-2">Nenhuma turma cadastrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {(() => {
              const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
              const today = days[new Date().getDay()];
              const todayClasses = classes.filter((c) => c.days.includes(today));
              const displayClasses = todayClasses.length > 0 ? todayClasses : classes.slice(0, 3);
              return displayClasses.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => onNavigateTab('turmas')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a1818] border border-[#272424] cursor-pointer hover:border-[#FF4A0F]/40"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{cls.name}</h4>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {cls.startTime} às {cls.endTime} • {cls.modality}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#FF4A0F] bg-[#FF4A0F]/10 px-2 py-1 rounded-md">
                    Chamada
                  </span>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Empty State Help Card if no students */}
      {students.length === 0 && (
        <div className="p-5 rounded-2xl bg-[#131212] border border-[#FF4A0F]/30 text-center">
          <Users className="w-8 h-8 text-[#FF4A0F] mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white mb-1">Nenhum aluno cadastrado</h4>
          <p className="text-xs text-[#9CA3AF] mb-4">
            Comece cadastrando seu primeiro aluno para ter controle de mensalidades e presenças.
          </p>
          <button
            onClick={onQuickAddStudent}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#FF4A0F] text-white font-bold text-xs inline-flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-[#FF4A0F]/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Primeiro Aluno</span>
          </button>
        </div>
      )}
    </div>
  );
};
