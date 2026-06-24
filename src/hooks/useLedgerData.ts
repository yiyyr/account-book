import { useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { ledgerRepository } from "../data/ledgerRepository";
import { compareBySortOrder, makeDefaultSettings } from "../domain/ledger";

export function useLedgerData() {
  const fallbackSettings = useMemo(() => makeDefaultSettings(), []);

  useEffect(() => {
    void ledgerRepository.initialize();
  }, []);

  const settings = useLiveQuery(
    () => db.settings.get("settings"),
    [],
    fallbackSettings
  );
  const envelopes = useLiveQuery(
    async () => (await db.envelopes.toArray()).sort(compareBySortOrder),
    [],
    []
  );
  const categories = useLiveQuery(
    async () => (await db.categories.toArray()).sort(compareBySortOrder),
    [],
    []
  );
  const transactions = useLiveQuery(
    async () =>
      (await db.transactions.toArray()).sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime()
      ),
    [],
    []
  );

  return {
    settings: settings ?? fallbackSettings,
    envelopes: envelopes ?? [],
    categories: categories ?? [],
    transactions: transactions ?? [],
    isReady: Boolean(settings)
  };
}
