// 定义仓库接口。

import type {
  AppSettings,
  Category,
  EnvelopeAccount,
  LedgerBackup,
  Transaction
} from "../domain/types";

export interface LedgerRepository {
  initialize(): Promise<void>;
  getSettings(): Promise<AppSettings>;
  updateCurrency(currency: string): Promise<void>;
  addEnvelope(name: string, color: string): Promise<string>;
  updateEnvelope(envelope: EnvelopeAccount): Promise<void>;
  addCategory(name: string, type: Category["type"], color: string): Promise<string>;
  addTransaction(
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ): Promise<string>;
  updateTransaction(transaction: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  replaceAll(backup: LedgerBackup): Promise<void>;
  clearAll(): Promise<void>;
  exportBackup(): Promise<LedgerBackup>;
  listEnvelopes(): Promise<EnvelopeAccount[]>;
  listCategories(): Promise<Category[]>;
  listTransactions(): Promise<Transaction[]>;
}
