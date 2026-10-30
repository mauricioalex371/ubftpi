import React, { useState, useEffect } from 'react';
import { 
  getSettings, 
  saveSettings, 
  getAllFromStore, 
  putInStore, 
  deleteFromStore,
  requestPersistentStorage,
  seedIfEmpty,
  importStudentFromFicha,
} from './db/indexedDB';
import { 
  Student, 
  ClassEntity, 
  AttendanceRecord, 
  MonthlyFee, 
  CashTransaction, 
  TrialStudent, 
  AppSettings 
} from './types';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { IosInstallPrompt } from './components/IosInstallPrompt';
import { OnboardingModal } from './components/OnboardingModal';
import { PinLockModal } from './components/PinLockModal';
import { BackupModal } from './components/BackupModal';

import { DashboardView } from './views/DashboardView';
import { StudentsView } from './views/StudentsView';
import { ClassesView } from './views/ClassesView';
import { FeesView } from './views/FeesView';
import { CashView } from './views/CashView';

import { getCurrentMonthYear, getTodayDateBR, generateUUID, isPast7Days } from './utils/formatters';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('inicio');
  const [loading, setLoading] = useState(true);

  // Database Data States (EMPTY by default per requirement #2)
  const [settings, setSettings] = useState<AppSettings>({
    academyName: 'UBF Team Parque Indiano',
    masterName: 'Mestre Uarlei Silva',
    isConfigured: false,
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<MonthlyFee[]>([]);
  const [cash, setCash] = useState<CashTransaction[]>([]);
  const [trials, setTrials] = useState<TrialStudent[]>([]);

  // Modals & Locks
  const [isLocked, setIsLocked] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [autoEditStudentId, setAutoEditStudentId] = useState<string | null>(null);

  // Mark overdue fees: any PENDENTE fee whose dueDate is before today gets ATRASADO
  const syncOverdueFees = async (feesArr: MonthlyFee[]): Promise<MonthlyFee[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const updated: MonthlyFee[] = [];

    for (const fee of feesArr) {
      if (fee.status === 'PENDENTE') {
        const parts = fee.dueDate.split('/');
        if (parts.length === 3) {
          const dueDate = new Date(
            parseInt(parts[2], 10),
            parseInt(parts[1], 10) - 1,
            parseInt(parts[0], 10)
          );
          if (dueDate < today) {
            const overdue: MonthlyFee = { ...fee, status: 'ATRASADO' };
            await putInStore('fees', overdue);
            updated.push(overdue);
            continue;
          }
        }
      }
      updated.push(fee);
    }
    return updated;
  };

  // Migrate old single-modality students to new modalities array
  const migrateStudents = async (studs: Student[]): Promise<Student[]> => {
    const migrated: Student[] = [];
    for (const s of studs) {
      if (!s.modalities || s.modalities.length === 0) {
        const updated: Student = {
          ...s,
          modalities: s.modality ? [s.modality] : ['Jiu-Jitsu'],
        };
        await putInStore('students', updated);
        migrated.push(updated);
      } else {
        migrated.push(s);
      }
    }
    return migrated;
  };

  // Load all data from IndexedDB on startup
  const loadDatabase = async () => {
    try {
      // Populate with master's data if this is a fresh install
      await seedIfEmpty();

      const [
        loadedSettings,
        loadedStudents,
        loadedClasses,
        loadedAttendance,
        loadedFees,
        loadedCash,
        loadedTrials,
      ] = await Promise.all([
        getSettings(),
        getAllFromStore<Student>('students'),
        getAllFromStore<ClassEntity>('classes'),
        getAllFromStore<AttendanceRecord>('attendance'),
        getAllFromStore<MonthlyFee>('fees'),
        getAllFromStore<CashTransaction>('cash'),
        getAllFromStore<TrialStudent>('trials'),
      ]);

      setSettings(loadedSettings);
      setClasses(loadedClasses || []);
      setAttendance(loadedAttendance || []);
      setCash(loadedCash || []);
      setTrials(loadedTrials || []);

      // Migrate old single-modality students
      const migratedStudents = await migrateStudents(loadedStudents || []);
      setStudents(migratedStudents);

      // Sync overdue fees on every load
      const syncedFees = await syncOverdueFees(loadedFees || []);
      setFees(syncedFees);

      // If PIN is enabled, lock app on fresh launch
      if (loadedSettings.pinCode) {
        setIsLocked(true);
      }
    } catch (err) {
      console.error('Error loading database', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
    requestPersistentStorage();

    // Check if master opened a ficha import link
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('importar');
    if (encoded) {
      importStudentFromFicha(encoded).then((student) => {
        if (student) {
          // Clean URL and reload to show the new student
          window.history.replaceState({}, '', window.location.pathname);
          loadDatabase().then(() => {
            setAutoEditStudentId(student.id);
            setCurrentTab('alunos');
            alert(`✅ Aluno "${student.name}" cadastrado com sucesso! Revise e complete os dados.`);
          });
        } else {
          alert('Erro ao importar ficha. Link inválido ou expirado.');
          window.history.replaceState({}, '', window.location.pathname);
        }
      });
    }
  }, []);

  // 1. Onboarding Complete Handler
  const handleOnboardingComplete = async (
    academyName: string,
    masterName: string,
    initialClass?: ClassEntity
  ) => {
    const updatedSettings: AppSettings = {
      ...settings,
      academyName,
      masterName,
      isConfigured: true,
    };

    await saveSettings(updatedSettings);
    setSettings(updatedSettings);

    if (initialClass) {
      await putInStore('classes', initialClass);
      setClasses([initialClass]);
    }
  };

  // 2. Student Handlers
  const handleSaveStudent = async (student: Student) => {
    await putInStore('students', student);
    setStudents((prev) => {
      const idx = prev.findIndex((s) => s.id === student.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = student;
        return copy;
      }
      return [...prev, student];
    });

    // If new active student, generate first month fee automatically
    const existingFee = fees.find(
      (f) => f.studentId === student.id && f.monthYear === getCurrentMonthYear()
    );
    if (!existingFee && student.status === 'ATIVO') {
      const currentMY = getCurrentMonthYear();
      const [m, y] = currentMY.split('/');
      const dueDateStr = `${String(student.dueDay).padStart(2, '0')}/${m}/${y}`;

      const newFee: MonthlyFee = {
        id: generateUUID(),
        studentId: student.id,
        studentName: student.name,
        monthYear: currentMY,
        dueDate: dueDateStr,
        amount: student.monthlyFee,
        amountPaid: 0,
        status: 'PENDENTE',
      };
      await putInStore('fees', newFee);
      setFees((prev) => [...prev, newFee]);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    // Cascade: remove fees and attendance records for this student
    const studentFees = fees.filter((f) => f.studentId === id);
    const studentAttendance = attendance.filter((a) => a.studentId === id);
    await Promise.all([
      deleteFromStore('students', id),
      ...studentFees.map((f) => deleteFromStore('fees', f.id)),
      ...studentAttendance.map((a) => deleteFromStore('attendance', a.id)),
    ]);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setFees((prev) => prev.filter((f) => f.studentId !== id));
    setAttendance((prev) => prev.filter((a) => a.studentId !== id));
  };

  // 3. Class Handlers
  const handleSaveClass = async (c: ClassEntity) => {
    await putInStore('classes', c);
    setClasses((prev) => {
      const idx = prev.findIndex((item) => item.id === c.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = c;
        return copy;
      }
      return [...prev, c];
    });
  };

  const handleDeleteClass = async (id: string) => {
    await deleteFromStore('classes', id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  // 4. Attendance Handlers
  const handleRecordAttendance = async (
    classId: string,
    studentId: string,
    date: string,
    status: 'PRESENTE' | 'FALTA'
  ) => {
    const existing = attendance.find(
      (a) => a.classId === classId && a.studentId === studentId && a.date === date
    );

    const record: AttendanceRecord = {
      id: existing ? existing.id : generateUUID(),
      classId,
      studentId,
      date,
      status,
    };

    await putInStore('attendance', record);
    setAttendance((prev) => {
      const idx = prev.findIndex((a) => a.id === record.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [...prev, record];
    });
  };

  // 5. Monthly Fees & Payment Handlers (Automatic Cash Integration!)
  const handleRegisterPayment = async (
    fee: MonthlyFee,
    amountPaid: number,
    method: 'PIX' | 'DINHEIRO' | 'CARTAO' | 'OUTRO',
    notes?: string
  ) => {
    const today = getTodayDateBR();

    // 1. Create Cash Entry for the revenue
    const cashEntry: CashTransaction = {
      id: generateUUID(),
      type: 'ENTRADA',
      category: 'Mensalidades',
      description: `Mensalidade ${fee.monthYear} - ${fee.studentName}`,
      amount: amountPaid,
      date: today,
      paymentMethod: method,
      feeId: fee.id,
      createdAt: Date.now(),
    };

    await putInStore('cash', cashEntry);
    setCash((prev) => [cashEntry, ...prev]);

    // 2. Update Fee status to PAGO
    const updatedFee: MonthlyFee = {
      ...fee,
      amountPaid,
      status: 'PAGO',
      paymentMethod: method,
      paidDate: today,
      cashTransactionId: cashEntry.id,
      notes: notes || fee.notes,
    };

    await putInStore('fees', updatedFee);
    setFees((prev) => prev.map((f) => (f.id === fee.id ? updatedFee : f)));
  };

  // 5b. Revert Payment — undo a fee payment and remove the cash entry
  const handleRevertPayment = async (fee: MonthlyFee) => {
    // Remove cash transaction linked to this fee
    if (fee.cashTransactionId) {
      await deleteFromStore('cash', fee.cashTransactionId);
      setCash((prev) => prev.filter((t) => t.id !== fee.cashTransactionId));
    }
    // Revert fee to PENDENTE
    const reverted: MonthlyFee = {
      ...fee,
      amountPaid: 0,
      status: 'PENDENTE',
      paymentMethod: undefined,
      paidDate: undefined,
      cashTransactionId: undefined,
    };
    await putInStore('fees', reverted);
    setFees((prev) => prev.map((f) => (f.id === fee.id ? reverted : f)));
  };

  const handleGenerateMonthFees = async (targetMonthYear?: string) => {
    const currentMY = targetMonthYear || getCurrentMonthYear();
    const [m, y] = currentMY.split('/');
    const activeStudents = students.filter((s) => s.status === 'ATIVO');

    let createdCount = 0;
    const newFees: MonthlyFee[] = [];

    for (const s of activeStudents) {
      const exists = fees.some((f) => f.studentId === s.id && f.monthYear === currentMY);
      if (!exists) {
        const dueDateStr = `${String(s.dueDay).padStart(2, '0')}/${m}/${y}`;
        const newFee: MonthlyFee = {
          id: generateUUID(),
          studentId: s.id,
          studentName: s.name,
          monthYear: currentMY,
          dueDate: dueDateStr,
          amount: s.monthlyFee,
          amountPaid: 0,
          status: 'PENDENTE',
        };
        await putInStore('fees', newFee);
        newFees.push(newFee);
        createdCount++;
      }
    }

    if (createdCount > 0) {
      setFees((prev) => [...prev, ...newFees]);
      alert(`${createdCount} mensalidades do mês ${currentMY} geradas com sucesso!`);
    } else {
      alert(`Todas as mensalidades do mês ${currentMY} já haviam sido geradas.`);
    }
  };

  // 6. Cash Handlers
  const handleAddTransaction = async (t: CashTransaction) => {
    await putInStore('cash', t);
    setCash((prev) => [t, ...prev]);
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteFromStore('cash', id);
    setCash((prev) => prev.filter((t) => t.id !== id));
  };

  // 7. Trial Classes Handlers
  const handleSaveTrial = async (t: TrialStudent) => {
    await putInStore('trials', t);
    setTrials((prev) => [t, ...prev.filter((item) => item.id !== t.id)]);
  };

  const handleConvertTrialToStudent = async (t: TrialStudent) => {
    // 1. Create Student
    const newStudent: Student = {
      id: generateUUID(),
      name: t.name,
      phone: t.phone,
      birthDate: '',
      isMinor: false,
      modalities: [t.modality],
      modality: t.modality,
      graduation: 'Faixa Branca',
      monthlyFee: 130,
      dueDay: 10,
      notes: `Convertido de aula experimental agendada em ${t.scheduledDate}. ${t.notes || ''}`,
      status: 'ATIVO',
      createdAt: Date.now(),
    };

    await handleSaveStudent(newStudent);

    // 2. Update trial status
    const updatedTrial: TrialStudent = { ...t, status: 'CONVERTIDA' };
    await putInStore('trials', updatedTrial);
    setTrials((prev) => prev.map((item) => (item.id === t.id ? updatedTrial : item)));

    // Switch to students tab and auto-open edit modal to complete the registration
    setAutoEditStudentId(newStudent.id);
    setCurrentTab('alunos');
  };

  const handleDeleteTrial = async (id: string) => {
    await deleteFromStore('trials', id);
    setTrials((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#131212] border border-[#FF4A0F] flex items-center justify-center animate-pulse">
            <img src="/icon.png" alt="UBF Team" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-xs text-[#9CA3AF] font-bold tracking-wider">CARREGANDO UBF TEAM...</span>
        </div>
      </div>
    );
  }

  // PIN Lock check
  if (isLocked && settings.pinCode) {
    return <PinLockModal correctPin={settings.pinCode} onUnlocked={() => setIsLocked(false)} />;
  }

  const unpaidCount = fees.filter((f) => f.status === 'ATRASADO').length;

  return (
    <div className="min-h-screen bg-[#050505] text-[#F9FAFB] flex flex-col font-sans">
      {/* iOS Safari Install Prompt (Discreet) */}
      <IosInstallPrompt />

      {/* Header */}
      <Header
        academyName={settings.academyName}
        masterName={settings.masterName}
        onOpenBackup={() => setIsBackupOpen(true)}
        hasBackupWarning={isPast7Days(settings.lastBackupDate)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-4">
        {currentTab === 'inicio' && (
          <DashboardView
            students={students}
            fees={fees}
            cash={cash}
            classes={classes}
            attendance={attendance}
            settings={settings}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onQuickAddStudent={() => setCurrentTab('alunos')}
          />
        )}

        {currentTab === 'alunos' && (
          <StudentsView
            students={students}
            classes={classes}
            fees={fees}
            attendance={attendance}
            academyName={settings.academyName}
            masterName={settings.masterName}
            masterPhone={settings.masterPhone}
            autoEditStudentId={autoEditStudentId}
            onAutoEditDone={() => setAutoEditStudentId(null)}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {currentTab === 'turmas' && (
          <ClassesView
            classes={classes}
            students={students}
            attendance={attendance}
            trials={trials}
            masterName={settings.masterName}
            onSaveClass={handleSaveClass}
            onDeleteClass={handleDeleteClass}
            onRecordAttendance={handleRecordAttendance}
            onSaveTrial={handleSaveTrial}
            onConvertTrialToStudent={handleConvertTrialToStudent}
            onDeleteTrial={handleDeleteTrial}
          />
        )}

        {currentTab === 'mensalidades' && (
          <FeesView
            fees={fees}
            students={students}
            academyName={settings.academyName}
            pixKey={settings.pixKey}
            onRegisterPayment={handleRegisterPayment}
            onRevertPayment={handleRevertPayment}
            onGenerateMonthFees={handleGenerateMonthFees}
          />
        )}

        {currentTab === 'caixa' && (
          <CashView
            transactions={cash}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
      </main>

      {/* Mobile-first Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        unpaidFeesCount={unpaidCount}
      />

      {/* First-time Onboarding Wizard */}
      {!settings.isConfigured && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      {/* Backup & Settings Modal */}
      {isBackupOpen && (
        <BackupModal
          settings={settings}
          onSaveSettings={async (updated) => {
            await saveSettings(updated);
            setSettings(updated);
          }}
          onClose={() => setIsBackupOpen(false)}
          onDataRestored={loadDatabase}
        />
      )}
    </div>
  );
};
