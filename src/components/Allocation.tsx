import { FormEvent, useMemo, useState } from "react";
import { ArrowRightLeft, Layers3, Plus } from "lucide-react";
import { ledgerRepository } from "../data/ledgerRepository";
import { currentDateInputValue } from "../domain/ledger";
import { formatMoney, parseMoneyToCents } from "../domain/money";
import type { AppSettings, EnvelopeAccount, LedgerSnapshot } from "../domain/types";

interface AllocationProps {
  settings: AppSettings;
  envelopes: EnvelopeAccount[];
  snapshot: LedgerSnapshot;
}

const colorOptions = [
  "#0f766e",
  "#c2410c",
  "#2563eb",
  "#7c3aed",
  "#be123c",
  "#4d7c0f",
  "#a16207",
  "#475569"
];

export function Allocation({ settings, envelopes, snapshot }: AllocationProps) {
  const [allocationDate, setAllocationDate] = useState(currentDateInputValue());
  const [allocationAmounts, setAllocationAmounts] = useState<Record<string, string>>({});
  const [newEnvelopeName, setNewEnvelopeName] = useState("");
  const [newEnvelopeColor, setNewEnvelopeColor] = useState(colorOptions[0]);
  const [fromEnvelopeId, setFromEnvelopeId] = useState("");
  const [toEnvelopeId, setToEnvelopeId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [status, setStatus] = useState("");

  const envelopeOptions = useMemo(
    () =>
      envelopes.map((envelope) => ({
        ...envelope,
        balance: snapshot.envelopeBalances[envelope.id] ?? 0
      })),
    [envelopes, snapshot.envelopeBalances]
  );

  async function handleAllocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    try {
      const entries = Object.entries(allocationAmounts)
        .map(([envelopeId, raw]) => ({
          envelopeId,
          amountCents: raw.trim() ? parseMoneyToCents(raw) : 0
        }))
        .filter((entry) => entry.amountCents > 0);
      const total = entries.reduce((sum, entry) => sum + entry.amountCents, 0);

      if (entries.length === 0) {
        throw new Error("请输入分配金额");
      }

      if (total > snapshot.unallocatedCents) {
        throw new Error("未分配资金不足");
      }

      await Promise.all(
        entries.map((entry) =>
          ledgerRepository.addTransaction({
            kind: "allocation",
            amountCents: entry.amountCents,
            occurredAt: new Date(`${allocationDate}T12:00:00`).toISOString(),
            toEnvelopeId: entry.envelopeId,
            note: "收入分配"
          })
        )
      );
      setAllocationAmounts({});
      setStatus("已分配");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "分配失败");
    }
  }

  async function handleAddEnvelope(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    try {
      const name = newEnvelopeName.trim();
      if (!name) {
        throw new Error("请输入信封名称");
      }
      await ledgerRepository.addEnvelope(name, newEnvelopeColor);
      setNewEnvelopeName("");
      setStatus("已新增信封");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "新增失败");
    }
  }

  async function handleTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    try {
      if (!fromEnvelopeId || !toEnvelopeId) {
        throw new Error("请选择信封");
      }
      if (fromEnvelopeId === toEnvelopeId) {
        throw new Error("请选择不同信封");
      }
      const amountCents = parseMoneyToCents(transferAmount);
      const sourceBalance = snapshot.envelopeBalances[fromEnvelopeId] ?? 0;
      if (amountCents > sourceBalance) {
        throw new Error("来源信封余额不足");
      }
      await ledgerRepository.addTransaction({
        kind: "transfer",
        amountCents,
        occurredAt: new Date().toISOString(),
        fromEnvelopeId,
        toEnvelopeId,
        note: "信封转账"
      });
      setTransferAmount("");
      setStatus("已转账");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "转账失败");
    }
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-heading">
          <h2>收入分配</h2>
          <Layers3 size={22} aria-hidden="true" />
        </div>
        <div className="unallocated-row prominent">
          <span>未分配资金</span>
          <strong>
            {formatMoney(snapshot.unallocatedCents, settings.currency)}
          </strong>
        </div>
        <form className="stacked-form" onSubmit={handleAllocation}>
          <label className="field">
            <span>日期</span>
            <input
              type="date"
              value={allocationDate}
              onChange={(event) => setAllocationDate(event.target.value)}
            />
          </label>
          <div className="allocation-list">
            {envelopeOptions.map((envelope) => (
              <label className="allocation-row" key={envelope.id}>
                <span className="allocation-name">
                  <i style={{ background: envelope.color }} />
                  {envelope.name}
                </span>
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={allocationAmounts[envelope.id] ?? ""}
                  onChange={(event) =>
                    setAllocationAmounts((current) => ({
                      ...current,
                      [envelope.id]: event.target.value
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <button className="primary-button" type="submit">
            <Layers3 size={18} aria-hidden="true" />
            分配
          </button>
        </form>
        {status && <p className="form-status">{status}</p>}
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>新增信封</h2>
          <Plus size={22} aria-hidden="true" />
        </div>
        <form className="stacked-form" onSubmit={handleAddEnvelope}>
          <label className="field">
            <span>名称</span>
            <input
              value={newEnvelopeName}
              onChange={(event) => setNewEnvelopeName(event.target.value)}
              maxLength={18}
            />
          </label>
          <div className="swatch-row" aria-label="信封颜色">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                className={newEnvelopeColor === color ? "swatch active" : "swatch"}
                style={{ background: color }}
                title={color}
                aria-label={`选择颜色 ${color}`}
                onClick={() => setNewEnvelopeColor(color)}
              />
            ))}
          </div>
          <button className="secondary-button" type="submit">
            <Plus size={18} aria-hidden="true" />
            新增
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>信封转账</h2>
          <ArrowRightLeft size={22} aria-hidden="true" />
        </div>
        <form className="stacked-form" onSubmit={handleTransfer}>
          <label className="field">
            <span>从</span>
            <select
              value={fromEnvelopeId}
              onChange={(event) => setFromEnvelopeId(event.target.value)}
            >
              <option value="">选择信封</option>
              {envelopeOptions.map((envelope) => (
                <option key={envelope.id} value={envelope.id}>
                  {envelope.name} · {formatMoney(envelope.balance, settings.currency)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>到</span>
            <select
              value={toEnvelopeId}
              onChange={(event) => setToEnvelopeId(event.target.value)}
            >
              <option value="">选择信封</option>
              {envelopeOptions.map((envelope) => (
                <option key={envelope.id} value={envelope.id}>
                  {envelope.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>金额</span>
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={transferAmount}
              onChange={(event) => setTransferAmount(event.target.value)}
            />
          </label>
          <button className="secondary-button" type="submit">
            <ArrowRightLeft size={18} aria-hidden="true" />
            转账
          </button>
        </form>
      </section>
    </div>
  );
}
