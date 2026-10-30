import React, { useState, useEffect } from 'react';
import {
  Users, Search, Plus, Send, Edit, Trash2, X, Check,
  MapPin, AlertCircle, ClipboardList, Copy, CheckCheck, BarChart2,
} from 'lucide-react';
import { Student, ClassEntity, MonthlyFee, AttendanceRecord } from '../types';
import { formatCurrency, generateWhatsAppUrl, generateUUID, calculateAge, generateFichaUrl } from '../utils/formatters';
import { EmptyState } from '../components/EmptyState';

interface StudentsViewProps {
  students: Student[];
  classes: ClassEntity[];
  fees: MonthlyFee[];
  attendance: AttendanceRecord[];
  academyName: string;
  masterName: string;
  masterPhone?: string;
  autoEditStudentId?: string | null;
  onAutoEditDone?: () => void;
  onSaveStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

const ALL_MODALITIES = ['Jiu-Jitsu', 'Muay Thai', 'MMA', 'Boxe', 'Funcional'];

// Helper: get the effective modalities list for a student (handles old single-modality records)
function getStudentModalities(s: Student): string[] {
  if (s.modalities && s.modalities.length > 0) return s.modalities;
  if (s.modality) return [s.modality];
  return [];
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classes,
  fees,
  attendance,
  academyName,
  masterName,
  masterPhone,
  autoEditStudentId,
  onAutoEditDone,
  onSaveStudent,
  onDeleteStudent,
}) => {
  const [search, setSearch] = useState('');
  const [filterModality, setFilterModality] = useState('TODAS');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'ATIVO' | 'TRANCADO' | 'CANCELADO'>('TODOS');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFichaModalOpen, setIsFichaModalOpen] = useState(false);
  const [fichaPhone, setFichaPhone] = useState('');
  const [fichaCopied, setFichaCopied] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [selectedModalities, setSelectedModalities] = useState<string[]>(['Jiu-Jitsu']);
  const [graduation, setGraduation] = useState('Faixa Branca');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [monthlyFee, setMonthlyFee] = useState('130');
  const [dueDay, setDueDay] = useState('10');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'ATIVO' | 'TRANCADO' | 'CANCELADO'>('ATIVO');

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredStudents = students.filter((s) => {
    const mods = getStudentModalities(s);
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.graduation.toLowerCase().includes(search.toLowerCase());
    const matchesModality =
      filterModality === 'TODAS' ||
      mods.some((m) => m.toLowerCase() === filterModality.toLowerCase());
    const matchesStatus = filterStatus === 'TODOS' || s.status === filterStatus;
    return matchesSearch && matchesModality && matchesStatus;
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const resetForm = () => {
    setName('');
    setPhone('');
    setBirthDate('');
    setIsMinor(false);
    setGuardianName('');
    setGuardianPhone('');
    setGuardianRelationship('');
    setAddress('');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setSelectedModalities(['Jiu-Jitsu']);
    setGraduation('Faixa Branca');
    setSelectedClassIds([]);
    setMonthlyFee('130');
    setDueDay('10');
    setNotes('');
    setStatus('ATIVO');
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setName(s.name);    setPhone(s.phone);
    setBirthDate(s.birthDate);
    setIsMinor(s.isMinor);
    setGuardianName(s.guardianName || '');
    setGuardianPhone(s.guardianPhone || '');
    setGuardianRelationship(s.guardianRelationship || '');
    setAddress(s.address || '');
    setEmergencyContactName(s.emergencyContactName || '');
    setEmergencyContactPhone(s.emergencyContactPhone || '');
    setSelectedModalities(getStudentModalities(s));
    setGraduation(s.graduation);
    setSelectedClassIds(s.classIds || (s.classId ? [s.classId] : []));
    setMonthlyFee(s.monthlyFee.toString());
    setDueDay(s.dueDay.toString());
    setNotes(s.notes || '');
    setStatus(s.status);
    setIsModalOpen(true);
  };

  // Auto-open edit modal when a trial is converted to student
  useEffect(() => {
    if (autoEditStudentId && students.length > 0) {
      const s = students.find((st) => st.id === autoEditStudentId);
      if (s) {
        handleOpenEdit(s);
        onAutoEditDone?.();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoEditStudentId, students]);

  const toggleModality = (mod: string) => {
    setSelectedModalities((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const toggleClassId = (id: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (selectedModalities.length === 0) {
      alert('Selecione ao menos uma modalidade.');
      return;
    }

    const student: Student = {
      id: editingStudent ? editingStudent.id : generateUUID(),
      name: name.trim(),
      phone: phone.trim(),
      birthDate: birthDate.trim(),
      isMinor,
      guardianName: isMinor ? guardianName.trim() : undefined,
      guardianPhone: isMinor ? guardianPhone.trim() : undefined,
      guardianRelationship: isMinor ? guardianRelationship.trim() : undefined,
      address: address.trim() || undefined,
      emergencyContactName: emergencyContactName.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      modalities: selectedModalities,
      modality: selectedModalities[0], // backwards-compat
      graduation: graduation.trim() || 'Faixa Branca',
      classIds: selectedClassIds.length > 0 ? selectedClassIds : undefined,
      classId: selectedClassIds[0] || undefined, // backwards-compat
      monthlyFee: parseFloat(monthlyFee) || 120,
      dueDay: parseInt(dueDay, 10) || 10,
      notes: notes.trim(),
      status,
      createdAt: editingStudent ? editingStudent.createdAt : Date.now(),
    };

    onSaveStudent(student);
    setIsModalOpen(false);
  };

  // Classes filtered to show in the class-link section based on selected modalities
  const relevantClasses = classes.filter((c) =>
    selectedModalities.length === 0 || selectedModalities.includes(c.modality)
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Alunos</h2>
          <p className="text-xs text-[#9CA3AF]">{students.length} cadastrados no sistema</p>
        </div>
        <div className="flex items-center gap-2">
          {masterPhone && (
            <button
              onClick={() => { setFichaPhone(''); setFichaCopied(false); setIsFichaModalOpen(true); }}
              className="min-h-[44px] px-3.5 rounded-xl bg-[#131212] border border-[#FF4A0F]/50 text-[#FF4A0F] font-bold text-xs flex items-center gap-1.5 hover:bg-[#FF4A0F]/10 active:scale-95 transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Enviar Ficha</span>
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="min-h-[44px] px-4 rounded-xl bg-[#FF4A0F] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#ff3b00] active:scale-95 transition-all shadow-md shadow-[#FF4A0F]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Aluno</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, WhatsApp ou faixa..."
          className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-[#131212] border border-[#272424] text-white text-xs placeholder:text-[#6B7280] focus:border-[#FF4A0F] focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Modality filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {['TODAS', ...ALL_MODALITIES].map((m) => (
          <button
            key={m}
            onClick={() => setFilterModality(m)}
            className={`min-h-[36px] px-3.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              filterModality === m
                ? 'bg-[#FF4A0F] text-white'
                : 'bg-[#131212] text-[#9CA3AF] border border-[#272424] hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5">
        {([
          ['TODOS', `Todos (${students.length})`],
          ['ATIVO', `Ativos (${students.filter(s=>s.status==='ATIVO').length})`],
          ['TRANCADO', `Trancados (${students.filter(s=>s.status==='TRANCADO').length})`],
          ['CANCELADO', `Cancelados (${students.filter(s=>s.status==='CANCELADO').length})`],
        ] as [typeof filterStatus, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`min-h-[34px] px-2.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex-1 ${
              filterStatus === key
                ? 'bg-[#FF4A0F] text-white'
                : 'bg-[#131212] text-[#9CA3AF] border border-[#272424] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Students list */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title={students.length === 0 ? 'Nenhum aluno cadastrado' : 'Nenhum aluno encontrado'}
          description={
            students.length === 0
              ? 'Cadastre seu primeiro aluno para começar a gerenciar turmas, presenças e mensalidades.'
              : 'Nenhum resultado corresponde à sua pesquisa ou filtro selecionado.'
          }
          actionLabel={students.length === 0 ? 'Cadastrar Primeiro Aluno' : undefined}
          onAction={students.length === 0 ? handleOpenAdd : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {filteredStudents.map((student) => {
            const age = calculateAge(student.birthDate);
            const mods = getStudentModalities(student);
            const linkedClasses = (student.classIds || (student.classId ? [student.classId] : []))
              .map((id) => classes.find((c) => c.id === id))
              .filter(Boolean) as ClassEntity[];

            return (
              <div
                key={student.id}
                className="p-3.5 rounded-2xl bg-[#131212] border border-[#272424] hover:border-[#FF4A0F]/40 transition-all shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Name + status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white">{student.name}</h3>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          student.status === 'ATIVO'
                            ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                            : 'bg-[#6B7280]/20 text-[#9CA3AF] border border-[#6B7280]/40'
                        }`}
                      >
                        {student.status}
                      </span>
                    </div>

                    {/* Modality chips */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mods.map((mod) => (
                        <span
                          key={mod}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF4A0F]/10 text-[#FF4A0F] border border-[#FF4A0F]/30"
                        >
                          {mod}
                        </span>
                      ))}
                      <span className="text-[10px] text-[#9CA3AF] self-center">• {student.graduation}</span>
                    </div>

                    {/* Info row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#9CA3AF] mt-1.5">
                      <span>Venc. dia {student.dueDay}</span>
                      <span>{formatCurrency(student.monthlyFee)}/mês</span>
                      {student.birthDate && (
                        <span>
                          {student.birthDate}
                          {age !== null && ` (${age} anos)`}
                        </span>
                      )}
                    </div>

                    {/* Linked classes */}
                    {linkedClasses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {linkedClasses.map((c) => (
                          <span
                            key={c.id}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#272424] text-[#9CA3AF]"
                          >
                            {c.name} • {c.days.join(',')} {c.startTime}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Guardian */}
                    {student.isMinor && student.guardianName && (
                      <p className="text-[11px] text-[#F59E0B] mt-1 bg-[#F59E0B]/10 px-2 py-1 rounded border border-[#F59E0B]/20 inline-block">
                        Menor • Resp: {student.guardianName}
                        {student.guardianPhone && ` (${student.guardianPhone})`}
                      </p>
                    )}

                    {/* Address */}
                    {student.address && (
                      <p className="text-[11px] text-[#6B7280] mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {student.address}
                      </p>
                    )}

                    {/* Emergency contact */}
                    {student.emergencyContactName && (
                      <p className="text-[11px] text-[#6B7280] mt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        Emerg: {student.emergencyContactName}
                        {student.emergencyContactPhone &&
                          ` · ${student.emergencyContactPhone}`}
                      </p>
                    )}

                    {student.notes && (
                      <p className="text-[11px] text-[#6B7280] mt-1 italic">Obs: {student.notes}</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {student.phone && (
                      <a
                        href={generateWhatsAppUrl(
                          student.phone,
                          `Olá ${student.name}! Mensagem da ${academyName}. Como estão seus treinos? Oss!`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] active:scale-95 transition-all"
                        title="WhatsApp"
                      >
                        <Send className="w-4 h-4" />
                      </a>
                    )}
                    {/* Enviar Ficha de Cadastro */}
                    {masterPhone && student.phone && (
                      <a
                        href={(() => {
                          const mods = getStudentModalities(student);
                          const fichaUrl = generateFichaUrl(
                            window.location.origin + window.location.pathname,
                            academyName,
                            masterName,
                            masterPhone,
                            mods[0]
                          );
                          return generateWhatsAppUrl(
                            student.phone,
                            `Olá ${student.name}! Para completar seu cadastro na ${academyName}, preencha a ficha pelo link abaixo — leva menos de 2 minutos:\n\n${fichaUrl}\n\nQualquer dúvida é só chamar! Oss! 🥋`
                          );
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl bg-[#FF4A0F]/15 border border-[#FF4A0F]/40 flex items-center justify-center text-[#FF4A0F] active:scale-95 transition-all"
                        title="Enviar ficha de cadastro"
                      >
                        <ClipboardList className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleOpenEdit(student)}
                      className="w-9 h-9 rounded-xl bg-[#050505] border border-[#272424] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:border-[#FF4A0F] active:scale-95 transition-all"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setHistoryStudent(student)}
                      className="w-9 h-9 rounded-xl bg-[#050505] border border-[#272424] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:border-[#FF4A0F] active:scale-95 transition-all"
                      title="Histórico financeiro e frequência"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Cadastro / Edição ──────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#131212] border border-[#272424] rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#272424] mb-4">
              <h3 className="text-base font-bold text-white">
                {editingStudent ? 'Editar Ficha do Aluno' : 'Cadastrar Novo Aluno'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CA3AF] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do aluno"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>

              {/* WhatsApp + Nascimento */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="21988887777"
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Nascimento</label>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="dd/mm/aaaa"
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Endereço
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>

              {/* Contato de emergência */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Contato Emergência
                  </label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Nome (parentesco)"
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Tel. Emergência</label>
                  <input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="21988887777"
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Menor de idade */}
              <div className="p-3 rounded-xl bg-[#050505] border border-[#272424]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMinor}
                    onChange={(e) => setIsMinor(e.target.checked)}
                    className="w-4 h-4 accent-[#FF4A0F] rounded"
                  />
                  <span className="text-xs font-bold text-white">Aluno Menor de Idade</span>
                </label>
                {isMinor && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-[#272424]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-[#9CA3AF] mb-1">Nome do Responsável *</label>
                        <input
                          type="text"
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          placeholder="Pai, mãe ou tutor"
                          className="w-full min-h-[40px] px-3 rounded-lg bg-[#131212] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#9CA3AF] mb-1">Parentesco</label>
                        <input
                          type="text"
                          value={guardianRelationship}
                          onChange={(e) => setGuardianRelationship(e.target.value)}
                          placeholder="Ex: Mãe"
                          className="w-full min-h-[40px] px-3 rounded-lg bg-[#131212] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#9CA3AF] mb-1">Telefone do Responsável</label>
                      <input
                        type="tel"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        placeholder="WhatsApp do responsável"
                        className="w-full min-h-[40px] px-3 rounded-lg bg-[#131212] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Modalidades (múltiplas) ── */}
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5">
                  Modalidades *{' '}
                  <span className="font-normal text-[#6B7280]">(pode selecionar mais de uma)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_MODALITIES.map((mod) => {
                    const isSelected = selectedModalities.includes(mod);
                    return (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => toggleModality(mod)}
                        className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#FF4A0F] text-white shadow-sm'
                            : 'bg-[#050505] text-[#9CA3AF] border border-[#272424] hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {mod}
                      </button>
                    );
                  })}
                </div>
                {selectedModalities.length === 0 && (
                  <p className="text-[11px] text-[#EF4444] mt-1">Selecione ao menos uma modalidade</p>
                )}
              </div>

              {/* Graduação */}
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Graduação / Faixa</label>
                <input
                  type="text"
                  value={graduation}
                  onChange={(e) => setGraduation(e.target.value)}
                  placeholder="Ex: Faixa Branca, Faixa Azul..."
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>

              {/* ── Turmas vinculadas (múltiplas) ── */}
              {classes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5">
                    Turmas Vinculadas{' '}
                    <span className="font-normal text-[#6B7280]">(opcional, pode vincular várias)</span>
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {(relevantClasses.length > 0 ? relevantClasses : classes).map((c) => {
                      const isLinked = selectedClassIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleClassId(c.id)}
                          className={`w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all ${
                            isLinked
                              ? 'bg-[#FF4A0F]/15 border border-[#FF4A0F]/60 text-white'
                              : 'bg-[#050505] border border-[#272424] text-[#9CA3AF] hover:text-white'
                          }`}
                        >
                          <span>
                            {c.name}{' '}
                            <span className="font-normal text-[#6B7280]">
                              • {c.modality} • {c.days.join(',')} {c.startTime}
                            </span>
                          </span>
                          {isLinked && <Check className="w-3.5 h-3.5 text-[#FF4A0F] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {selectedClassIds.length === 0 && (
                    <p className="text-[11px] text-[#6B7280] mt-1">Nenhuma turma vinculada</p>
                  )}
                </div>
              )}

              {/* Mensalidade + vencimento */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Mensalidade (R$)</label>
                  <input
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Dia Venc. (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ATIVO', 'TRANCADO', 'CANCELADO'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`min-h-[40px] rounded-lg text-xs font-bold transition-all ${
                        status === st
                          ? 'bg-[#FF4A0F] text-white'
                          : 'bg-[#050505] text-[#9CA3AF] border border-[#272424]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Lesões, objetivos, atestado médico..."
                  className="w-full p-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none resize-none"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-2.5 pt-3">
                {editingStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja realmente excluir o aluno ${editingStudent.name}?`)) {
                        onDeleteStudent(editingStudent.id);
                        setIsModalOpen(false);
                      }
                    }}
                    className="min-h-[44px] px-4 rounded-xl border border-[#EF4444]/40 text-[#EF4444] text-xs font-bold hover:bg-[#EF4444]/10 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] rounded-xl bg-[#FF4A0F] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#ff3b00] active:scale-95 shadow-md shadow-[#FF4A0F]/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingStudent ? 'Salvar Alterações' : 'Cadastrar Aluno'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Histórico do Aluno ──────────────────────────────────────── */}
      {historyStudent && (() => {
        const studentFees = fees
          .filter((f) => f.studentId === historyStudent.id)
          .sort((a, b) => b.monthYear.split('/').reverse().join('').localeCompare(a.monthYear.split('/').reverse().join('')));
        const studentAttendance = attendance.filter((a) => a.studentId === historyStudent.id);
        const totalPresent = studentAttendance.filter((a) => a.status === 'PRESENTE').length;
        const totalMarked = studentAttendance.length;
        const pct = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : null;
        const lastPresence = studentAttendance
          .filter((a) => a.status === 'PRESENTE')
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        const daysSince = lastPresence ? Math.floor((Date.now() - new Date(lastPresence.date).getTime()) / 86400000) : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm bg-[#131212] border border-[#272424] rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#272424] mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{historyStudent.name}</h3>
                  <p className="text-xs text-[#FF4A0F]">{historyStudent.graduation}</p>
                </div>
                <button onClick={() => setHistoryStudent(null)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CA3AF] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Frequência */}
              <div className="p-3 rounded-xl bg-[#050505] border border-[#272424] mb-3">
                <p className="text-[10px] font-bold uppercase text-[#9CA3AF] mb-2">Frequência</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black text-white">{pct !== null ? `${pct}%` : '—'}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{totalPresent} de {totalMarked} aulas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">Última presença</p>
                    <p className={`text-[11px] font-semibold ${daysSince !== null && daysSince > 15 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                      {lastPresence ? `${lastPresence.date} (${daysSince}d atrás)` : 'Nenhuma'}
                    </p>
                  </div>
                </div>
                {pct !== null && (
                  <div className="mt-2 h-2 bg-[#272424] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct >= 75 ? 'bg-[#10B981]' : pct >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'}`} style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>

              {/* Mensalidades */}
              <p className="text-[10px] font-bold uppercase text-[#9CA3AF] mb-2">Mensalidades</p>
              {studentFees.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-3">Nenhuma mensalidade gerada</p>
              ) : (
                <div className="space-y-1.5">
                  {studentFees.map((f) => (
                    <div key={f.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#050505] border border-[#272424] text-xs">
                      <span className="text-white font-semibold">{f.monthYear}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{formatCurrency(f.amount)}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          f.status === 'PAGO' ? 'bg-[#10B981]/15 text-[#10B981]' :
                          f.status === 'ATRASADO' ? 'bg-[#EF4444]/15 text-[#EF4444]' :
                          'bg-[#F59E0B]/15 text-[#F59E0B]'
                        }`}>{f.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Modal: Enviar Ficha de Cadastro ───────────────────────────────── */}
      {isFichaModalOpen && masterPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-[#131212] border border-[#272424] rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#272424] mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#FF4A0F]" />
                <h3 className="text-sm font-bold text-white">Enviar Ficha de Cadastro</h3>
              </div>
              <button
                onClick={() => setIsFichaModalOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CA3AF] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Link da ficha */}
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Link da Ficha</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generateFichaUrl(
                      window.location.origin + window.location.pathname,
                      academyName,
                      masterName,
                      masterPhone
                    )}
                    className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-[#9CA3AF] text-xs focus:outline-none truncate"
                  />
                  <button
                    onClick={() => {
                      const url = generateFichaUrl(
                        window.location.origin + window.location.pathname,
                        academyName,
                        masterName,
                        masterPhone
                      );
                      navigator.clipboard.writeText(url);
                      setFichaCopied(true);
                      setTimeout(() => setFichaCopied(false), 2000);
                    }}
                    className={`min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                      fichaCopied
                        ? 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981]'
                        : 'bg-[#050505] border-[#272424] text-[#9CA3AF] hover:text-white hover:border-[#FF4A0F]'
                    }`}
                    title="Copiar link"
                  >
                    {fichaCopied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {fichaCopied && (
                  <p className="text-[11px] text-[#10B981] mt-1">Link copiado!</p>
                )}
              </div>

              {/* Enviar por WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                  Enviar pelo WhatsApp
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={fichaPhone}
                    onChange={(e) => setFichaPhone(e.target.value)}
                    placeholder="21988887777"
                    className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-sm focus:border-[#FF4A0F] focus:outline-none"
                  />
                  <a
                    href={fichaPhone.trim() ? generateWhatsAppUrl(
                      fichaPhone,
                      `Olá! Para se cadastrar na ${academyName} preencha sua ficha pelo link abaixo — leva menos de 2 minutos:\n\n${generateFichaUrl(
                        window.location.origin + window.location.pathname,
                        academyName,
                        masterName,
                        masterPhone
                      )}\n\nQualquer dúvida é só chamar! Oss! 🥋`
                    ) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { if (!fichaPhone.trim()) e.preventDefault(); }}
                    className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                      fichaPhone.trim()
                        ? 'bg-[#10B981] text-black shadow-md shadow-[#10B981]/20'
                        : 'bg-[#272424] text-[#6B7280] cursor-not-allowed'
                    }`}
                    title="Enviar no WhatsApp"
                  >
                    <Send className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  Digite o número e toque no ícone para abrir o WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
