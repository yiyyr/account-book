// 定义数据结构，包括表名称，字段等关键信息

export type CategoryType = "income" | "expense";

export type TransactionKind =
  | "income"
  | "expense"
  | "allocation"
  | "transfer"
  | "adjustment";

export interface EnvelopeAccount {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  sortOrder: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  kind: TransactionKind;
  amountCents: number;
  occurredAt: string;
  categoryId?: string;
  fromEnvelopeId?: string;
  toEnvelopeId?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: "settings";
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerSnapshot {
  envelopeBalances: Record<string, number>;
  unallocatedCents: number;
  totalBalanceCents: number;
  monthlyIncomeCents: number;
  monthlyExpenseCents: number;
  monthStart: string;
  monthEnd: string;
}

export interface LedgerBackup {
  schemaVersion: 1;
  exportedAt: string;
  settings: AppSettings;
  envelopes: EnvelopeAccount[];
  categories: Category[];
  transactions: Transaction[];
}

export interface LedgerData {
  settings: AppSettings;
  envelopes: EnvelopeAccount[];
  categories: Category[];
  transactions: Transaction[];
}
