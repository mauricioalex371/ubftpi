import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Check,
  X,
  UserCheck,
  UserX,
  Clock,
  Users,
  Trash2,
  UserPlus,
  Send,
  History,
  Edit,
} from 'lucide-react';
import { ClassEntity, Student, AttendanceRecord, TrialStudent } from '../types';
import { generateUUID, getTodayDateBR, generateWhatsAppUrl } from '../utils/formatters';
import { EmptyState } from '../components/EmptyState';

interface ClassesViewProps {
  classes: ClassEntity[];
  students: Student[];
  attendance: AttendanceRecord[];
  trials: TrialStudent[];
  masterName: string;
  onSaveClass: (c: ClassEntity) => void;
  onDeleteClass: (id: string) => void;
  onRecordAttendance: (classId: string, studentId: string, date: string, status: 'PRESENTE' | 'FALTA') => void;
  onSaveTrial: (t: TrialStudent) => void;
  onConvertTrialToStudent: (t: TrialStudent) => void;
  onDeleteTrial: (id: string) => void;
}

const MODALITIES = ['Jiu-Jitsu', 'Muay Thai', 'MMA', 'Boxe', 'Funcional'];
const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Helper: a student belongs to a class if classIds includes it, or classId (old) matches
function studentBelongsToClass(student: Student, classId: string): boolean {
  if (student.classIds && student.classIds.length > 0) {
    return student.classIds.includes(classId);
  }
  return student.classId === classId;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  students,
  attendance,
  trials,
  masterName,
  onSaveClass,
  onDeleteClass,
  onRecordAttendance,
  onSaveTrial,
  onConvertTrialToStudent,
  onDeleteTrial,
}) => {
  const [subTab, setSubTab] = useState<'turmas' | 'chamada' | 'experimentais'>('turmas');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modal states
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassEntity | null>(null);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [studentHistoryModal, setStudentHistoryModal] = useState<Student | null>(null);

  // Class Form State
  const [className, setClassName] = useState('');
  const [classModality, setClassModality] = useState('Jiu-Jitsu');
  const [classLevel, setClassLevel] = useState('Todos os Níveis');
  const [classInstructor, setClassInstructor] = useState(masterName);
  const [classDays, setClassDays] = useState<string[]>(['Seg', 'Qua', 'Sex']);
  const [classStartTime, setClassStartTime] = useState('19:30');
  const [classEndTime, setClassEndTime] = useState('21:00');
  const [classMaxCapacity, setClassMaxCapacity] = useState('30');

  // Trial Form
  const [trialName, setTrialName] = useState('');
  const [trialPhone, setTrialPhone] = useState('');
  const [trialModality, setTrialModality] = useState('Jiu-Jitsu');
  const [trialDate, setTrialDate] = useState(getTodayDateBR());
  const [trialNotes, setTrialNotes] = useState('');

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleDay = (day: string) =>
    setClassDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const openNewClass = () => {
    setEditingClass(null);
    setClassName('');
    setClassModality('Jiu-Jitsu');
    setClassLevel('Todos os Níveis');
    setClassInstructor(masterName);
    setClassDays(['Seg', 'Qua', 'Sex']);
    setClassStartTime('19:30');
    setClassEndTime('21:00');
    setClassMaxCapacity('30');
    setIsClassModalOpen(true);
  };

  const openEditClass = (cls: ClassEntity) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setClassModality(cls.modality);
    setClassLevel(cls.level);
    setClassInstructor(cls.instructor);
    setClassDays(cls.days);
    setClassStartTime(cls.startTime);
    setClassEndTime(cls.endTime);
    setClassMaxCapacity(cls.maxCapacity.toString());
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    const saved: ClassEntity = {
      id: editingClass ? editingClass.id : generateUUID(),
      name: className.trim(),
      modality: classModality,
      level: classLevel,
      instructor: classInstructor.trim() || masterName,
      days: classDays.length > 0 ? classDays : ['Seg', 'Qua', 'Sex'],
      startTime: classStartTime,
      endTime: classEndTime,
      maxCapacity: parseInt(classMaxCapacity, 10) || 30,
    };

    onSaveClass(saved);
    if (!selectedClassId) setSelectedClassId(saved.id);
    setIsClassModalOpen(false);
  };

  const handleCreateTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialName.trim()) return;

    const newTrial: TrialStudent = {
      id: generateUUID(),
      name: trialName.trim(),
      phone: trialPhone.trim(),
      modality: trialModality,
      scheduledDate: trialDate.trim(),
      status: 'AGENDADA',
      notes: trialNotes.trim(),
      createdAt: Date.now(),
    };

    onSaveTrial(newTrial);
    setIsTrialModalOpen(false);
  };

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Only students explicitly linked to this class
  const classStudents = activeClass
    ? students.filter(
        (s) => s.status === 'ATIVO' && studentBelongsToClass(s, activeClass.id)
      )
    : [];

  return (
    <div className="space-y-4 pb-20">
      {/* Sub tabs */}
      <div className="flex bg-[#131212] p-1 rounded-xl border border-[#272424]">
        {([
          ['turmas', `Turmas (${classes.length})`],
          ['chamada', 'Chamada'],
          ['experimentais', `Experimentais (${trials.filter((t) => t.status === 'AGENDADA').length})`],
        ] as [string, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab as any)}
            className={`flex-1 min-h-[38px] rounded-lg text-xs font-bold transition-all ${
              subTab === tab ? 'bg-[#FF4A0F] text-white shadow-md' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── 1. GRADE DE TURMAS ─────────────────────────────────────────────── */}
      {subTab === 'turmas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Grade de Aulas</h3>
            <button
              onClick={openNewClass}
              className="min-h-[44px] px-4 rounded-xl bg-[#FF4A0F] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#ff3b00] active:scale-95 shadow-md shadow-[#FF4A0F]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Turma</span>
            </button>
          </div>

          {classes.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nenhuma turma cadastrada"
              description="Cadastre as turmas e horários de treino da sua academia."
              actionLabel="Criar Primeira Turma"
              onAction={openNewClass}
            />
          ) : (
            <div className="space-y-3">
              {classes.map((cls) => {
                const enrolledCount = students.filter(
                  (s) => s.status === 'ATIVO' && studentBelongsToClass(s, cls.id)
                ).length;

                return (
                  <div
                    key={cls.id}
                    className="p-4 rounded-2xl bg-[#131212] border border-[#272424] hover:border-[#FF4A0F]/40 transition-all shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{cls.name}</h4>
                          <span className="text-[10px] font-bold text-[#FF4A0F] bg-[#FF4A0F]/10 px-2 py-0.5 rounded-full border border-[#FF4A0F]/30">
                            {cls.modality}
                          </span>
                        </div>
                        <p className="text-xs text-[#9CA3AF] mt-1">
                          Professor: {cls.instructor} • Nível: {cls.level} • Capacidade: {cls.maxCapacity}
                        </p>
                      </div>

                      {/* Edit + Delete */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditClass(cls)}
                          className="w-9 h-9 rounded-xl bg-[#050505] border border-[#272424] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:border-[#FF4A0F] active:scale-95 transition-all"
                          title="Editar Turma"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja excluir a turma ${cls.name}?`)) onDeleteClass(cls.id);
                          }}
                          className="w-9 h-9 rounded-xl bg-[#050505] border border-[#272424] flex items-center justify-center text-[#9CA3AF] hover:text-[#EF4444] hover:border-[#EF4444]/40 active:scale-95 transition-all"
                          title="Excluir Turma"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-[#272424] text-xs">
                      <div className="flex items-center gap-1.5 text-white font-semibold">
                        <Clock className="w-4 h-4 text-[#FF4A0F]" />
                        <span>
                          {cls.days.join(', ')} • {cls.startTime} às {cls.endTime}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          setSubTab('chamada');
                        }}
                        className="min-h-[36px] px-3 rounded-lg bg-[#FF4A0F]/15 border border-[#FF4A0F]/40 text-[#FF4A0F] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Chamada ({enrolledCount})</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 2. CHAMADA ─────────────────────────────────────────────────────── */}
      {subTab === 'chamada' && (
        <div className="space-y-4">
          {classes.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Crie uma turma primeiro"
              description="Você precisa cadastrar ao menos uma turma para registrar chamada."
              actionLabel="Cadastrar Turma"
              onAction={openNewClass}
            />
          ) : (
            <>
              <div className="p-3.5 rounded-2xl bg-[#131212] border border-[#272424] space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#9CA3AF] uppercase mb-1">
                    Selecionar Turma
                  </label>
                  <select
                    value={activeClass?.id || ''}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs font-bold focus:border-[#FF4A0F] focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.days.join(', ')} {c.startTime})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#9CA3AF] uppercase mb-1">
                    Data da Aula
                  </label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-[#9CA3AF] uppercase">
                    Alunos vinculados ({classStudents.length})
                  </h4>
                  <span className="text-[11px] text-[#FF4A0F] font-semibold">1 toque para marcar</span>
                </div>

                {classStudents.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF] p-4 text-center bg-[#131212] rounded-xl border border-[#272424]">
                    Nenhum aluno vinculado a esta turma.{' '}
                    <span className="text-[#FF4A0F]">Edite o aluno e vincule à turma desejada.</span>
                  </p>
                ) : (
                  classStudents.map((student) => {
                    const currentRecord = attendance.find(
                      (a) =>
                        a.classId === activeClass?.id &&
                        a.studentId === student.id &&
                        a.date === attendanceDate
                    );
                    const isPresent = currentRecord?.status === 'PRESENTE';
                    const isAbsent = currentRecord?.status === 'FALTA';
                    const presentTotal = attendance.filter(
                      (a) => a.studentId === student.id && a.classId === activeClass?.id && a.status === 'PRESENTE'
                    ).length;

                    return (
                      <div
                        key={student.id}
                        className={`p-3 rounded-xl bg-[#131212] border transition-all flex items-center justify-between gap-2 ${
                          isPresent
                            ? 'border-[#10B981]/50 bg-[#10B981]/5'
                            : isAbsent
                            ? 'border-[#EF4444]/50 bg-[#EF4444]/5'
                            : 'border-[#272424]'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{student.name}</h4>
                          <p className="text-[11px] text-[#9CA3AF]">
                            {student.graduation} • {presentTotal} presenças nesta turma
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setStudentHistoryModal(student)}
                            className="w-9 h-9 rounded-lg border border-[#272424] text-[#9CA3AF] hover:text-white flex items-center justify-center"
                            title="Histórico"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRecordAttendance(activeClass!.id, student.id, attendanceDate, 'FALTA')}
                            className={`min-h-[40px] px-3 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                              isAbsent
                                ? 'bg-[#EF4444] text-white shadow-md'
                                : 'bg-[#050505] border border-[#272424] text-[#9CA3AF] hover:text-[#EF4444]'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Falta</span>
                          </button>
                          <button
                            onClick={() => onRecordAttendance(activeClass!.id, student.id, attendanceDate, 'PRESENTE')}
                            className={`min-h-[40px] px-3.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                              isPresent
                                ? 'bg-[#10B981] text-black shadow-md'
                                : 'bg-[#050505] border border-[#272424] text-[#9CA3AF] hover:text-[#10B981]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Presente</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 3. AULAS EXPERIMENTAIS ─────────────────────────────────────────── */}
      {subTab === 'experimentais' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Interessados</h3>
            <button
              onClick={() => {
                setTrialName('');
                setTrialPhone('');
                setTrialDate(getTodayDateBR());
                setTrialNotes('');
                setIsTrialModalOpen(true);
              }}
              className="min-h-[44px] px-4 rounded-xl bg-[#FF4A0F] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#ff3b00] active:scale-95 shadow-md shadow-[#FF4A0F]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar Experimental</span>
            </button>
          </div>

          {trials.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="Nenhuma aula experimental agendada"
              description="Cadastre pessoas interessadas em conhecer a academia."
              actionLabel="Agendar Primeiro Interessado"
              onAction={() => setIsTrialModalOpen(true)}
            />
          ) : (
            <div className="space-y-2.5">
              {trials.map((trial) => (
                <div
                  key={trial.id}
                  className="p-3.5 rounded-2xl bg-[#131212] border border-[#272424] shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{trial.name}</h4>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            trial.status === 'CONVERTIDA'
                              ? 'bg-[#10B981]/20 text-[#10B981]'
                              : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                          }`}
                        >
                          {trial.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">
                        {trial.modality} • {trial.scheduledDate} • {trial.phone}
                      </p>
                      {trial.notes && (
                        <p className="text-[11px] text-[#6B7280] mt-1 italic">Obs: {trial.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {trial.phone && (
                        <a
                          href={generateWhatsAppUrl(
                            trial.phone,
                            `Olá ${trial.name}! Confirmando sua aula experimental de ${trial.modality} no dia ${trial.scheduledDate}. Venha com roupa confortável para treino! Oss!`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] active:scale-95"
                        >
                          <Send className="w-4 h-4" />
                        </a>
                      )}
                      {trial.status !== 'CONVERTIDA' && (
                        <button
                          onClick={() => onConvertTrialToStudent(trial)}
                          className="min-h-[40px] px-3 rounded-xl bg-[#FF4A0F] text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 shadow-md shadow-[#FF4A0F]/20"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Matricular</span>
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteTrial(trial.id)}
                        className="text-[#6B7280] hover:text-[#EF4444] p-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Turma (Nova / Edição) ───────────────────────────────────── */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#131212] border border-[#272424] rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#272424] mb-4">
              <h3 className="text-base font-bold text-white">
                {editingClass ? 'Editar Turma' : 'Nova Turma'}
              </h3>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CA3AF] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Nome da Turma *</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ex: Jiu-Jitsu Adulto Noite"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Modalidade</label>
                  <select
                    value={classModality}
                    onChange={(e) => setClassModality(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  >
                    {MODALITIES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Professor</label>
                  <input
                    type="text"
                    value={classInstructor}
                    onChange={(e) => setClassInstructor(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Nível</label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  >
                    <option>Todos os Níveis</option>
                    <option>Iniciante</option>
                    <option>Intermediário</option>
                    <option>Avançado</option>
                    <option>Infantil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Capacidade máx.</label>
                  <input
                    type="number"
                    min="1"
                    value={classMaxCapacity}
                    onChange={(e) => setClassMaxCapacity(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5">Dias da Semana</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`min-w-[44px] min-h-[38px] px-2.5 rounded-lg text-xs font-bold transition-all ${
                        classDays.includes(day)
                          ? 'bg-[#FF4A0F] text-white'
                          : 'bg-[#050505] text-[#9CA3AF] border border-[#272424]'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Início</label>
                  <input
                    type="time"
                    value={classStartTime}
                    onChange={(e) => setClassStartTime(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Término</label>
                  <input
                    type="time"
                    value={classEndTime}
                    onChange={(e) => setClassEndTime(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                {editingClass && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Excluir a turma "${editingClass.name}"?`)) {
                        onDeleteClass(editingClass.id);
                        setIsClassModalOpen(false);
                      }
                    }}
                    className="min-h-[44px] px-4 rounded-xl border border-[#EF4444]/40 text-[#EF4444] text-xs font-bold hover:bg-[#EF4444]/10 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 min-h-[46px] rounded-xl bg-[#FF4A0F] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#ff3b00] active:scale-95 shadow-md shadow-[#FF4A0F]/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingClass ? 'Salvar Alterações' : 'Criar Turma'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Aula Experimental ───────────────────────────────────────── */}
      {isTrialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#131212] border border-[#272424] rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#272424] mb-4">
              <h3 className="text-base font-bold text-white">Agendar Aula Experimental</h3>
              <button
                onClick={() => setIsTrialModalOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CA3AF] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrial} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Nome do Interessado *</label>
                <input
                  type="text"
                  required
                  value={trialName}
                  onChange={(e) => setTrialName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={trialPhone}
                    onChange={(e) => setTrialPhone(e.target.value)}
                    placeholder="21988887777"
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Data (dd/mm/aaaa)</label>
                  <input
                    type="text"
                    value={trialDate}
                    onChange={(e) => setTrialDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Modalidade</label>
                <select
                  value={trialModality}
                  onChange={(e) => setTrialModality(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none"
                >
                  {MODALITIES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={trialNotes}
                  onChange={(e) => setTrialNotes(e.target.value)}
                  placeholder="Objetivo, experiência anterior..."
                  className="w-full p-3 rounded-xl bg-[#050505] border border-[#272424] text-white text-xs focus:border-[#FF4A0F] focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-[#FF4A0F] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#ff3b00] active:scale-95 shadow-md shadow-[#FF4A0F]/20 mt-4"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Agendamento</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Histórico de Presença ───────────────────────────────────── */}
      {studentHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#131212] border border-[#272424] rounded-2xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#272424] mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">{studentHistoryModal.name}</h3>
                <p className="text-xs text-[#FF4A0F]">
                  {studentHistoryModal.graduation} •{' '}
                  {activeClass?.name}
                </p>
              </div>
              <button
                onClick={() => setStudentHistoryModal(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CA3AF] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-[#9CA3AF] mb-2">
                Presenças nesta turma
              </h4>
              {attendance.filter(
                (a) => a.studentId === studentHistoryModal.id && a.classId === activeClass?.id
              ).length === 0 ? (
                <p className="text-xs text-[#6B7280] py-3 text-center">
                  Nenhuma chamada registrada ainda nesta turma.
                </p>
              ) : (
                attendance
                  .filter(
                    (a) => a.studentId === studentHistoryModal.id && a.classId === activeClass?.id
                  )
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#050505] border border-[#272424] text-xs"
                    >
                      <span className="text-white font-medium">{rec.date}</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          rec.status === 'PRESENTE'
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : 'bg-[#EF4444]/15 text-[#EF4444]'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
