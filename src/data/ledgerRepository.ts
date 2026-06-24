// 封装对数据库的读写功能。数据访问层，将业务逻辑（domain里的纯函数）与底层数据库（IndexedDB）串联

import { db } from "./db";
import type { LedgerRepository } from "./repository";
import type {
  EnvelopeAccount,
  LedgerBackup,
  Transaction
} from "../domain/types";
import {
  buildBackup,
  compareBySortOrder,
  createId,
  getDefaultCategories,
  getDefaultEnvelopes,
  makeDefaultSettings,
  normalizeDisplayName,
  normalizeNameKey,
  nowIso
} from "../domain/ledger";

// 核心类数据仓库的具体实现
export class DexieLedgerRepository implements LedgerRepository {
  // 初始化
  async initialize() {
    await db.transaction("rw", db.settings, db.envelopes, db.categories, async () => {
      const settings = await db.settings.get("settings");
      //检测是否有数据，无则进行初始化工作
      const envelopeCount = await db.envelopes.count();
      const categoryCount = await db.categories.count();

      if (settings && envelopeCount > 0 && categoryCount > 0) {
        return;
      }

      if (!settings) {
        await db.settings.put(makeDefaultSettings());
      }

      if (envelopeCount === 0) {
        await db.envelopes.bulkPut(getDefaultEnvelopes());
      }
      if (categoryCount === 0) {
        await db.categories.bulkPut(getDefaultCategories());
      }
    });
  }

  async getSettings() {
    const settings = await db.settings.get("settings");
    return settings ?? makeDefaultSettings();
  }

  async updateCurrency(currency: string) {
    const settings = await this.getSettings();
    await db.settings.put({
      ...settings,
      currency: currency.toUpperCase(),
      updatedAt: nowIso()
    });
  }
  // 信封的CRUD
  async addEnvelope(name: string, color: string) {
    const displayName = normalizeDisplayName(name);
    if (!displayName) {
      throw new Error("请输入信封名称");
    }

    const envelopes = await this.listEnvelopes();
    assertUniqueEnvelopeName(envelopes, displayName);

    const now = nowIso();
    const envelope: EnvelopeAccount = {
      id: createId("env"),
      name: displayName,
      color,
      sortOrder: envelopes.length,
      archived: false,
      createdAt: now,
      updatedAt: now
    };
    await db.envelopes.add(envelope);
    return envelope.id;
  }

  async updateEnvelope(envelope: EnvelopeAccount) {
    await db.envelopes.put({
      ...envelope,
      updatedAt: nowIso()
    });
  }
  // 类目的CRUD
  async addCategory(name: string, type: "income" | "expense", color: string) {
    const displayName = normalizeDisplayName(name);
    if (!displayName) {
      throw new Error("请输入类目名称");
    }

    const categories = (await this.listCategories()).filter(
      (category) => category.type === type
    );
    assertUniqueCategoryName(categories, displayName, type);

    const now = nowIso();
    const category = {
      id: createId(type === "income" ? "inc" : "exp"),
      name: displayName,
      type,
      color,
      sortOrder: categories.length,
      archived: false,
      createdAt: now,
      updatedAt: now
    };
    await db.categories.add(category);
    return category.id;
  }
  // 交易的CRUD
  async addTransaction(
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ) {
    const now = nowIso();
    const record: Transaction = {
      ...transaction,
      id: createId("tx"),
      createdAt: now,
      updatedAt: now
    };
    await db.transactions.add(record);
    return record.id;
  }

  async updateTransaction(transaction: Transaction) {
    const existing = await db.transactions.get(transaction.id);
    if (!existing) {
      throw new Error("记录不存在");
    }

    await db.transactions.put({
      ...transaction,
      createdAt: existing.createdAt,
      updatedAt: nowIso()
    });
  }

  async deleteTransaction(id: string) {
    await db.transactions.delete(id);
  }
// 全量还原
  async replaceAll(backup: LedgerBackup) {
    assertUniqueEnvelopeNames(backup.envelopes);
    assertUniqueCategoryNames(backup.categories);

    await db.transaction(
      "rw",
      db.settings,
      db.envelopes,
      db.categories,
      db.transactions,
      async () => {
        await db.settings.clear();
        await db.envelopes.clear();
        await db.categories.clear();
        await db.transactions.clear();
        await db.settings.put(backup.settings);
        await db.envelopes.bulkPut(backup.envelopes);
        await db.categories.bulkPut(backup.categories);
        await db.transactions.bulkPut(backup.transactions);
      }
    );
  }
// 重置
  async clearAll() {
    await db.transaction(
      "rw",
      db.settings,
      db.envelopes,
      db.categories,
      db.transactions,
      async () => {
        await db.settings.clear();
        await db.envelopes.clear();
        await db.categories.clear();
        await db.transactions.clear();
      }
    );
    await this.initialize();
  }
// 导出备份
  async exportBackup() {
    const [settings, envelopes, categories, transactions] = await Promise.all([
      this.getSettings(),
      this.listEnvelopes(),
      this.listCategories(),
      this.listTransactions()
    ]);

    return buildBackup(settings, envelopes, categories, transactions);
  }

  async listEnvelopes() {
    return (await db.envelopes.toArray()).sort(compareBySortOrder);
  }

  async listCategories() {
    return (await db.categories.toArray()).sort(compareBySortOrder);
  }

  async listTransactions() {
    return (await db.transactions.toArray()).sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
    );
  }
}

export const ledgerRepository = new DexieLedgerRepository();

function assertUniqueEnvelopeNames(envelopes: EnvelopeAccount[]) {
  const seen = new Set<string>();
  for (const envelope of envelopes) {
    if (envelope.archived) {
      continue;
    }

    const key = normalizeNameKey(envelope.name);
    if (seen.has(key)) {
      throw new Error(`信封名称已存在：${envelope.name}`);
    }
    seen.add(key);
  }
}

function assertUniqueEnvelopeName(envelopes: EnvelopeAccount[], name: string) {
  assertUniqueEnvelopeNames([
    ...envelopes,
    {
      id: "__new__",
      name,
      color: "#000000",
      sortOrder: envelopes.length,
      archived: false,
      createdAt: nowIso(),
      updatedAt: nowIso()
    }
  ]);
}

function assertUniqueCategoryNames(
  categories: Array<{ name: string; type: string; archived: boolean }>
) {
  const seen = new Set<string>();
  for (const category of categories) {
    if (category.archived) {
      continue;
    }

    const key = `${category.type}:${normalizeNameKey(category.name)}`;
    if (seen.has(key)) {
      throw new Error(`类目名称已存在：${category.name}`);
    }
    seen.add(key);
  }
}

function assertUniqueCategoryName(
  categories: Array<{ name: string; type: string; archived: boolean }>,
  name: string,
  type: "income" | "expense"
) {
  assertUniqueCategoryNames([
    ...categories,
    {
      name,
      type,
      archived: false
    }
  ]);
}
