import { FormEvent, useMemo, useState } from "react";
import { Check, CircleDollarSign } from "lucide-react";
import { ledgerRepository } from "../data/ledgerRepository";
import { currentDateInputValue } from "../domain/ledger";
import { parseMoneyToCents } from "../domain/money";
import type { Category, EnvelopeAccount, Transaction } from "../domain/types";

interface QuickEntryProps {
  categories: Category[];
  envelopes: EnvelopeAccount[];
  onSaved: () => void;
}

export function QuickEntry({ categories, envelopes, onSaved }: QuickEntryProps) {
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(currentDateInputValue());
  const [categoryId, setCategoryId] = useState("");
  const [envelopeId, setEnvelopeId] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === kind),
    [categories, kind]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    try {
      const amountCents = parseMoneyToCents(amount);
      const transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt"> = {
        kind,
        amountCents,
        occurredAt: new Date(`${date}T12:00:00`).toISOString(),
        categoryId,
        note: note.trim() || undefined
      };

      if (!categoryId) {
        throw new Error("请选择类目");
      }

      if (kind === "expense") {
        if (!envelopeId) {
          throw new Error("请选择信封");
        }
        transaction.fromEnvelopeId = envelopeId;
      }

      await ledgerRepository.addTransaction(transaction);
      setAmount("");
      setNote("");
      setStatus("已保存");
      onSaved();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存失败");
    }
  }

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="section-heading">
        <h2>快速记账</h2>
        <CircleDollarSign size={22} aria-hidden="true" />
      </div>

      <div className="segmented-control" role="tablist" aria-label="记账类型">
        <button
          type="button"
          className={kind === "expense" ? "active" : ""}
          onClick={() => {
            setKind("expense");
            setCategoryId("");
          }}
        >
          支出
        </button>
        <button
          type="button"
          className={kind === "income" ? "active" : ""}
          onClick={() => {
            setKind("income");
            setCategoryId("");
          }}
        >
          收入
        </button>
      </div>

      <label className="field">
        <span>金额</span>
        <input
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>日期</span>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>类目</span>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          required
        >
          <option value="">选择类目</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {kind === "expense" && (
        <label className="field">
          <span>信封</span>
          <select
            value={envelopeId}
            onChange={(event) => setEnvelopeId(event.target.value)}
            required
          >
            <option value="">选择信封</option>
            {envelopes.map((envelope) => (
              <option key={envelope.id} value={envelope.id}>
                {envelope.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="field">
        <span>备注</span>
        <textarea
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <button className="primary-button" type="submit">
        <Check size={18} aria-hidden="true" />
        保存
      </button>
      {status && <p className="form-status">{status}</p>}
    </form>
  );
}
