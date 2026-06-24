import { describe, expect, it } from "vitest";
import {
  calculateSnapshot,
  getDefaultCategories,
  getDefaultEnvelopes,
  normalizeDisplayName,
  normalizeNameKey
} from "./ledger";
import type { EnvelopeAccount, Transaction } from "./types";

const envelopes: EnvelopeAccount[] = [
  makeEnvelope("env_necessary", "必要支出", 0),
  makeEnvelope("env_travel", "旅游", 1)
];

describe("calculateSnapshot", () => {
  it("keeps income in unallocated before allocation", () => {
    const snapshot = calculateSnapshot(envelopes, [
      makeTransaction("income", 100_000, "2026-06-01")
    ]);

    expect(snapshot.unallocatedCents).toBe(100_000);
    expect(snapshot.totalBalanceCents).toBe(100_000);
  });

  it("moves allocated money into envelopes and deducts expenses", () => {
    const snapshot = calculateSnapshot(envelopes, [
      makeTransaction("income", 100_000, "2026-06-01"),
      makeTransaction("allocation", 40_000, "2026-06-01", {
        toEnvelopeId: "env_necessary"
      }),
      makeTransaction("expense", 12_500, "2026-06-02", {
        fromEnvelopeId: "env_necessary"
      })
    ]);

    expect(snapshot.unallocatedCents).toBe(60_000);
    expect(snapshot.envelopeBalances.env_necessary).toBe(27_500);
    expect(snapshot.totalBalanceCents).toBe(87_500);
  });

  it("transfers money between envelopes", () => {
    const snapshot = calculateSnapshot(envelopes, [
      makeTransaction("income", 80_000, "2026-06-01"),
      makeTransaction("allocation", 30_000, "2026-06-01", {
        toEnvelopeId: "env_necessary"
      }),
      makeTransaction("transfer", 10_000, "2026-06-03", {
        fromEnvelopeId: "env_necessary",
        toEnvelopeId: "env_travel"
      })
    ]);

    expect(snapshot.envelopeBalances.env_necessary).toBe(20_000);
    expect(snapshot.envelopeBalances.env_travel).toBe(10_000);
    expect(snapshot.totalBalanceCents).toBe(80_000);
  });
});

describe("default data", () => {
  it("uses stable default envelope and category ids", () => {
    expect(getDefaultEnvelopes().map((envelope) => envelope.id)).toEqual([
      "env_default_daily_life",
      "env_default_food",
      "env_default_personal_care",
      "env_default_housing",
      "env_default_daily_leisure",
      "env_default_big_wish",
      "env_default_travel",
      "env_default_savings",
      "env_default_emergency",
      "env_default_family",
      "env_default_investment"
    ]);
    expect(getDefaultCategories().map((category) => category.id)).toEqual([
      "cat_income_salary",
      "cat_income_bonus",
      "cat_income_reimbursement",
      "cat_income_investment",
      "cat_income_other",
      "cat_expense_dining",
      "cat_expense_grocery",
      "cat_expense_daily_care",
      "cat_expense_clothing",
      "cat_expense_housing",
      "cat_expense_transport",
      "cat_expense_leisure",
      "cat_expense_learning",
      "cat_expense_fitness",
      "cat_expense_digital",
      "cat_expense_home",
      "cat_expense_travel",
      "cat_expense_medical",
      "cat_expense_other"
    ]);
  });

  it("normalizes names before duplicate checks", () => {
    expect(normalizeDisplayName("  旅游   支出  ")).toBe("旅游 支出");
    expect(normalizeNameKey("  FOOD  ")).toBe("food");
  });
});

function makeEnvelope(
  id: string,
  name: string,
  sortOrder: number
): EnvelopeAccount {
  return {
    id,
    name,
    color: "#0f766e",
    sortOrder,
    archived: false,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z"
  };
}

function makeTransaction(
  kind: Transaction["kind"],
  amountCents: number,
  date: string,
  extra: Partial<Transaction> = {}
): Transaction {
  return {
    id: `${kind}_${amountCents}`,
    kind,
    amountCents,
    occurredAt: `${date}T12:00:00.000Z`,
    createdAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
    ...extra
  };
}
