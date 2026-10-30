export type StudentStatus = 'ATIVO' | 'TRANCADO' | 'CANCELADO';

export interface Student {
  id: string;
  name: string;
  phone: string;
  birthDate: string; // dd/mm/aaaa
  isMinor: boolean;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  // modalities replaces the old single modality field
  modalities: string[];          // ["Jiu-Jitsu", "Funcional"]
  modality?: string;             // kept for backwards-compat with old records
  graduation: string;
  classIds?: string[];           // multiple class links
  classId?: string;              // kept for backwards-compat
  monthlyFee: number;
  dueDay: number; // 1 to 31
  notes?: string;
  status: StudentStatus;
  createdAt: number;
}

export interface ClassEntity {
  id: string;
  name: string;
  modality: string;
  level: string;
  instructor: string;
  days: string[]; // e.g. ['Seg', 'Qua', 'Sex']
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  maxCapacity: number;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string; // yyyy-mm-dd
  status: 'PRESENTE' | 'FALTA';
}

export type FeeStatus = 'PAGO' | 'PENDENTE' | 'ATRASADO';

export interface MonthlyFee {
  id: string;
  studentId: string;
  studentName: string;
  monthYear: string; // mm/aaaa
  dueDate: string; // dd/mm/aaaa
  amount: number;
  amountPaid: number;
  status: FeeStatus;
  paymentMethod?: 'PIX' | 'DINHEIRO' | 'CARTAO' | 'OUTRO';
  paidDate?: string;
  cashTransactionId?: string;
  notes?: string;
}

export type CashType = 'ENTRADA' | 'SAIDA';

export interface CashTransaction {
  id: string;
  type: CashType;
  category: string;
  description: string;
  amount: number;
  date: string; // dd/mm/aaaa
  paymentMethod: string;
  feeId?: string;
  createdAt: number;
}

export interface TrialStudent {
  id: string;
  name: string;
  phone: string;
  modality: string;
  scheduledDate: string; // dd/mm/aaaa
  status: 'AGENDADA' | 'CONVERTIDA';
  notes?: string;
  createdAt: number;
}

export interface AppSettings {
  academyName: string;
  masterName: string;
  masterPhone?: string;       // master's whatsapp to receive enrollment forms
  pinCode?: string;
  lastBackupDate?: string;
  isConfigured: boolean;
  pixKey?: string;
  whatsappGreeting?: string;
}
