export function parseMoneyToCents(value: string): number {
  const normalized = value.trim().replace(/,/g, "");

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("金额格式不正确");
  }

  const [yuan, cents = ""] = normalized.split(".");
  return Number(yuan) * 100 + Number(cents.padEnd(2, "0"));
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatMoney(cents: number, currency = "CNY"): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  }).format(cents / 100);
}

export function formatSignedMoney(cents: number, currency = "CNY"): string {
  const prefix = cents > 0 ? "+" : "";
  return `${prefix}${formatMoney(cents, currency)}`;
}
