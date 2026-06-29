import type {
  AppSettings,
  Category,
  EnvelopeAccount,
  LedgerBackup,
  LedgerSnapshot,
  Transaction
} from "./types";

const DEFAULT_COLORS = [
  "#0f766e",
  "#c2410c",
  "#2563eb",
  "#7c3aed",
  "#be123c",
  "#4d7c0f",
  "#a16207",
  "#475569"
];
// 工具函数，返回时间，名称标准化等
export function nowIso() {
  return new Date().toISOString();
}

export function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeNameKey(value: string) {
  return normalizeDisplayName(value).toLocaleLowerCase("zh-CN");
}

export function currentDateInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// 默认工厂函数
export function makeDefaultSettings(): AppSettings {
  const now = nowIso();
  return {
    id: "settings",
    currency: "CNY",
    createdAt: now,
    updatedAt: now
  };
}
// 实体工厂函数
export function makeEnvelope(
  name: string,
  sortOrder: number,
  color = DEFAULT_COLORS[sortOrder % DEFAULT_COLORS.length]
): EnvelopeAccount {
  const now = nowIso();
  return {
    id: createId("env"),
    name,
    color,
    sortOrder,
    archived: false,
    createdAt: now,
    updatedAt: now
  };
}

export function makeCategory(
  name: string,
  type: Category["type"],
  sortOrder: number,
  color = DEFAULT_COLORS[sortOrder % DEFAULT_COLORS.length]
): Category {
  const now = nowIso();
  return {
    id: createId(type === "income" ? "inc" : "exp"),
    name,
    type,
    color,
    sortOrder,
    archived: false,
    createdAt: now,
    updatedAt: now
  };
}
// 返回初始化预设列表
export function getDefaultEnvelopes() {
  return [
    /*------------------------ 一、衣食住行等日常生活等必要支出 --------------------------------*/
    // 日常低频、必要/半必要的生活消耗：
    // 纸巾、洗衣液、牙膏、清洁用品、工具、小额生活用品、小额家用电器，以及日常交通出行等
    makeDefaultEnvelope("env_default_daily_life", "日常生活", 0, "#0f766e"),
    // 食：堂食、外卖、水果、零食、饮料、买菜、调料等支出
    makeDefaultEnvelope("env_default_food", "餐饮买菜", 1, "#c2410c"),
    // 衣：衣服、鞋、理发、护肤、个护、基础配饰等
    makeDefaultEnvelope("env_default_personal_care", "穿搭个护", 2, "#be123c"),
    // 住：房租、水电、网费、押金、搬家、租房维修等
    makeDefaultEnvelope("env_default_housing", "住房账单", 3, "#475569"),
    
    /*------------------------ 二、娱乐等日常消费，亟需要管控的一部分--------------------------------*/
    // 日常休闲成长，包括同城休闲玩乐（电影、漫展、演出、商场等）、运动健身、学习成长、线上娱乐（订阅、游戏等）、消费电子等
    // 单笔支出通常小于 500 元
    makeDefaultEnvelope("env_default_daily_leisure", "日常休闲", 4, "#7c3aed"),
    // 手机、平板、耳机、显示器、相机、大家电、大型生活用品等
    // 通常为 500/1000 元以上、需要提前攒钱再购买
    makeDefaultEnvelope("env_default_big_wish", "大额心愿", 5, "#a16207"),
    // 机票、火车票、酒店、旅游餐饮、旅游购物、门票、演唱会等，多用于跨城游玩（本地演唱会也算）
    makeDefaultEnvelope("env_default_travel", "旅行出游", 6, "#2563eb"),

    /*------------------------ 三、生活安全感与长期弹性 --------------------------------*/
    // 长期大额储蓄，原则上不动，日后可做低风险理财或超大额资金支出备用
    makeDefaultEnvelope("env_default_savings", "长期储蓄", 7, "#7c3aed"),
    // 紧急备用金，用于日常生活中的意外支出，包括突发医疗、意外、临时必需支出等
    makeDefaultEnvelope("env_default_emergency", "应急备用", 8, "#0891b2"),
    // 基于父母养老/家庭支持的资金，预期心理账户
    makeDefaultEnvelope("env_default_family", "父母备用", 9, "#db2777"),
    // 用于日后的股票、基金、理财的本金，预期心理账户
    makeDefaultEnvelope("env_default_investment", "投资本金", 10, "#4d7c0f")
  ];
}

export function getDefaultCategories() {
  return [
    /*------------------------ 一、收入类目 --------------------------------*/
    makeDefaultCategory("cat_income_salary", "工资", "income", 0, "#0f766e"),
    makeDefaultCategory("cat_income_bonus", "奖金", "income", 1, "#4d7c0f"),
    makeDefaultCategory("cat_income_reimbursement", "报销", "income", 2, "#0891b2"),
    makeDefaultCategory("cat_income_investment","投资收入","income",3,"#2563eb"),
    makeDefaultCategory("cat_income_other", "其他收入", "income", 4, "#64748b"),  // 红包、礼金、以及可能的其他收入

    /*------------------------ 二、支出类目 --------------------------------*/
    // 堂食、外卖、食堂、咖啡、奶茶、饮料等即时餐饮消费
    makeDefaultCategory("cat_expense_dining", "餐饮外食", "expense", 0, "#c2410c"),
    // 买菜、水果、零食、调料、超市食品等
    makeDefaultCategory("cat_expense_grocery", "买菜零食", "expense", 1, "#ea580c"),
    // 纸巾、洗衣液、牙膏、洗发水、护肤、剃须、清洁用品等
    makeDefaultCategory("cat_expense_daily_care", "日用个护", "expense", 2, "#0f766e"),
    // 衣服、鞋、袜子、理发、基础配饰等
    makeDefaultCategory("cat_expense_clothing", "服饰穿搭", "expense", 3, "#be123c"),
    // 房租、水电、燃气、网费、物业、押金、搬家、租房维修等
    makeDefaultCategory("cat_expense_housing", "住房账单", "expense", 4, "#475569"),
    // 地铁、公交、打车、共享单车、小电驴、火车等日常交通
    makeDefaultCategory("cat_expense_transport", "交通出行", "expense", 5, "#a16207"),
    // 会员、游戏、电影、演出、同城玩乐、兴趣消费等
    makeDefaultCategory("cat_expense_leisure", "休闲娱乐", "expense", 6, "#7c3aed"),
    // 书籍、课程、考试、资料、学习工具等
    makeDefaultCategory("cat_expense_learning", "学习成长", "expense", 7, "#4d7c0f"),
    // 健身、游泳、运动装备、运动场馆等
    makeDefaultCategory("cat_expense_fitness", "运动健身", "expense", 8, "#16a34a"),
    // 软件订阅、云服务、数码配件、游戏设备、小型电子产品等
    makeDefaultCategory("cat_expense_digital", "数码软件", "expense", 9, "#2563eb"),
    // 家具、家电、厨具、收纳、床品、显示器、路由器等生活耐用品
    makeDefaultCategory("cat_expense_home", "家居家电", "expense", 10, "#92400e"),
    // 机票、火车票、酒店、门票、旅行餐饮、旅游购物等
    makeDefaultCategory("cat_expense_travel", "旅行出游", "expense", 11, "#0284c7"),
    // 看病、买药、体检、牙科、医疗器械等
    makeDefaultCategory("cat_expense_medical", "医疗健康", "expense", 12, "#0891b2"),
    // 无法归入以上类型的支出
    makeDefaultCategory("cat_expense_other", "其他支出", "expense", 14, "#64748b")
  ];
}
//同样的实体工厂函数，这里与上面的区别是可以接受显式id
function makeDefaultEnvelope(
  id: string,
  name: string,
  sortOrder: number,
  color: string
): EnvelopeAccount {
  const now = nowIso();
  return {
    id,
    name,
    color,
    sortOrder,
    archived: false,
    createdAt: now,
    updatedAt: now
  };
}

function makeDefaultCategory(
  id: string,
  name: string,
  type: Category["type"],
  sortOrder: number,
  color: string
): Category {
  const now = nowIso();
  return {
    id,
    name,
    type,
    color,
    sortOrder,
    archived: false,
    createdAt: now,
    updatedAt: now
  };
}
// id生成器，成为唯一的id前缀
export function createId(prefix: string) {
  if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
// 快照计算（核心财务计算），包含各信封余额、未分配资金、总余额、月收入、月支出以及当月起止日期的快照对象
export function calculateSnapshot(
  envelopes: EnvelopeAccount[],
  transactions: Transaction[],
  referenceDate = new Date()
): LedgerSnapshot {
  const envelopeBalances = Object.fromEntries(
    envelopes.map((envelope) => [envelope.id, 0])
  ) as Record<string, number>;
  let unallocatedCents = 0;

  for (const transaction of transactions) {
    const amount = transaction.amountCents;

    if (transaction.kind === "income") {
      unallocatedCents += amount;
      continue;
    }

    if (transaction.kind === "expense") {
      if (transaction.fromEnvelopeId) {
        envelopeBalances[transaction.fromEnvelopeId] =
          (envelopeBalances[transaction.fromEnvelopeId] ?? 0) - amount;
      } else {
        unallocatedCents -= amount;
      }
      continue;
    }

    if (transaction.kind === "allocation") {
      unallocatedCents -= amount;
      if (transaction.toEnvelopeId) {
        envelopeBalances[transaction.toEnvelopeId] =
          (envelopeBalances[transaction.toEnvelopeId] ?? 0) + amount;
      }
      continue;
    }

    if (transaction.kind === "transfer") {
      if (transaction.fromEnvelopeId) {
        envelopeBalances[transaction.fromEnvelopeId] =
          (envelopeBalances[transaction.fromEnvelopeId] ?? 0) - amount;
      }
      if (transaction.toEnvelopeId) {
        envelopeBalances[transaction.toEnvelopeId] =
          (envelopeBalances[transaction.toEnvelopeId] ?? 0) + amount;
      } else {
        unallocatedCents += amount;
      }
      continue;
    }

    if (transaction.kind === "adjustment") {
      if (transaction.toEnvelopeId) {
        envelopeBalances[transaction.toEnvelopeId] =
          (envelopeBalances[transaction.toEnvelopeId] ?? 0) + amount;
      } else {
        unallocatedCents += amount;
      }
    }
  }

  const { monthStart, monthEnd } = getMonthRange(referenceDate);
  const monthStartTime = new Date(monthStart).getTime();
  const monthEndTime = new Date(monthEnd).getTime();
  const monthlyTransactions = transactions.filter((transaction) => {
    const time = new Date(transaction.occurredAt).getTime();
    return time >= monthStartTime && time <= monthEndTime;
  });

  const monthlyIncomeCents = sumByKind(monthlyTransactions, "income");
  const monthlyExpenseCents = sumByKind(monthlyTransactions, "expense");
  const totalBalanceCents =
    unallocatedCents +
    Object.values(envelopeBalances).reduce((sum, value) => sum + value, 0);

  return {
    envelopeBalances,
    unallocatedCents,
    totalBalanceCents,
    monthlyIncomeCents,
    monthlyExpenseCents,
    monthStart,
    monthEnd
  };
}
// 用于上述代码的辅助计算公式
export function sumByKind(
  transactions: Transaction[],
  kind: Transaction["kind"]
) {
  return transactions
    .filter((transaction) => transaction.kind === kind)
    .reduce((sum, transaction) => sum + transaction.amountCents, 0);
}

export function calculateEnvelopeMonthActivity(
  transactions: Transaction[],
  monthKey: string
) {
  const allocatedCents: Record<string, number> = {};
  const expenseCents: Record<string, number> = {};
  const transferInCents: Record<string, number> = {};
  const transferOutCents: Record<string, number> = {};

  for (const transaction of transactions) {
    if (getMonthKey(transaction.occurredAt) !== monthKey) {
      continue;
    }

    if (transaction.kind === "allocation" && transaction.toEnvelopeId) {
      allocatedCents[transaction.toEnvelopeId] =
        (allocatedCents[transaction.toEnvelopeId] ?? 0) +
        transaction.amountCents;
    }

    if (transaction.kind === "expense" && transaction.fromEnvelopeId) {
      expenseCents[transaction.fromEnvelopeId] =
        (expenseCents[transaction.fromEnvelopeId] ?? 0) +
        transaction.amountCents;
    }

    if (transaction.kind === "transfer") {
      if (transaction.toEnvelopeId) {
        transferInCents[transaction.toEnvelopeId] =
          (transferInCents[transaction.toEnvelopeId] ?? 0) +
          transaction.amountCents;
      }
      if (transaction.fromEnvelopeId) {
        transferOutCents[transaction.fromEnvelopeId] =
          (transferOutCents[transaction.fromEnvelopeId] ?? 0) +
          transaction.amountCents;
      }
    }
  }

  return { allocatedCents, expenseCents, transferInCents, transferOutCents };
}

export function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

  return {
    monthStart: start.toISOString(),
    monthEnd: end.toISOString()
  };
}

export function getMonthKey(dateValue: string) {
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getLastMonthKeys(count: number, referenceDate = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - (count - index - 1),
      1
    );
    return getMonthKey(date.toISOString());
  });
}
// 备份构建
export function buildBackup(
  settings: AppSettings,
  envelopes: EnvelopeAccount[],
  categories: Category[],
  transactions: Transaction[]
): LedgerBackup {
  return {
    schemaVersion: 1,
    exportedAt: nowIso(),
    settings,
    envelopes,
    categories,
    transactions
  };
}

export function compareBySortOrder<T extends { sortOrder: number; name: string }>(
  left: T,
  right: T
) {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
}
