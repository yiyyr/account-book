import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuickEntry } from "./QuickEntry";
import type { Category, EnvelopeAccount } from "../domain/types";

const categories: Category[] = [
  makeCategory("cat_food", "餐饮", "expense"),
  makeCategory("cat_salary", "工资", "income")
];

const envelopes: EnvelopeAccount[] = [
  {
    id: "env_daily",
    name: "必要支出",
    color: "#0f766e",
    sortOrder: 0,
    archived: false,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z"
  }
];

describe("QuickEntry", () => {
  it("renders expense entry controls", () => {
    render(
      <QuickEntry
        categories={categories}
        envelopes={envelopes}
        onSaved={() => undefined}
      />
    );

    expect(screen.getByRole("heading", { name: "快速记账" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "餐饮" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "必要支出" })).toBeInTheDocument();
  });
});

function makeCategory(
  id: string,
  name: string,
  type: Category["type"]
): Category {
  return {
    id,
    name,
    type,
    color: "#0f766e",
    sortOrder: 0,
    archived: false,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z"
  };
}
