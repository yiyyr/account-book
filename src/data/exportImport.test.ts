import { describe, expect, it } from "vitest";
import { parseBackupJson, serializeTransactionsCsv } from "./exportImport";
import type {
  AppSettings,
  Category,
  EnvelopeAccount,
  LedgerBackup,
  Transaction
} from "../domain/types";

const settings: AppSettings = {
  id: "settings",
  currency: "CNY",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z"
};

const categories: Category[] = [
  {
    id: "cat_food",
    name: "餐饮",
    type: "expense",
    color: "#c2410c",
    sortOrder: 0,
    archived: false,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt
  }
];

const envelopes: EnvelopeAccount[] = [
  {
    id: "env_daily",
    name: "必要支出",
    color: "#0f766e",
    sortOrder: 0,
    archived: false,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt
  }
];

const transactions: Transaction[] = [
  {
    id: "tx_1",
    kind: "expense",
    amountCents: 1280,
    occurredAt: "2026-06-12T12:00:00.000Z",
    categoryId: "cat_food",
    fromEnvelopeId: "env_daily",
    note: "午餐,咖啡",
    createdAt: "2026-06-12T12:00:00.000Z",
    updatedAt: "2026-06-12T12:00:00.000Z"
  }
];

describe("exportImport", () => {
  it("serializes transactions as CSV with escaped notes", () => {
    const csv = serializeTransactionsCsv(transactions, categories, envelopes);

    expect(csv).toContain("日期,类型,金额,收入类目,支出类目,来源信封,目标信封,备注");
    expect(csv).toContain('2026-06-12,支出,12.80,,餐饮,必要支出,,"午餐,咖啡"');
  });

  it("parses supported backup JSON", () => {
    const backup: LedgerBackup = {
      schemaVersion: 1,
      exportedAt: "2026-06-16T00:00:00.000Z",
      settings,
      envelopes,
      categories,
      transactions
    };

    expect(parseBackupJson(JSON.stringify(backup))).toEqual(backup);
  });

  it("rejects unsupported backup versions", () => {
    expect(() =>
      parseBackupJson(JSON.stringify({ schemaVersion: 999 }))
    ).toThrow("备份版本不支持");
  });
});
