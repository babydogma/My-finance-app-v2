// 05-accounts.js — account loading, balance math, account CRUD.
(() => {
  const ADJUSTMENTS_KEY = window.AppConfig.metaKeys.accountAdjustments;

  function parseAdjustments() {
    const raw = window.AppState.getMetaValue(ADJUSTMENTS_KEY, "{}");

    try {
      const parsed = JSON.parse(String(raw || "{}"));
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function getManualAdjustment(accountId) {
    const value = Number(parseAdjustments()[accountId]);
    return Number.isFinite(value) ? window.Utils.roundMoney(value) : 0;
  }

  function getAccountById(accountId) {
    return window.AppState.state.accounts.find((account) => String(account.id) === String(accountId)) || null;
  }

  function getAccountName(accountId) {
    return getAccountById(accountId)?.name || "Счёт";
  }

  function getAccountRawBalance(accountId) {
    const account = getAccountById(accountId);
    if (!account) return 0;

    const accountName = account.name;

    return window.Utils.roundMoney(
      window.AppState.state.transactions.reduce((sum, transaction) => {
        const amount = window.Utils.roundMoney(transaction.amount);

        if (transaction.type === "income") {
          const byId = transaction.account_id && String(transaction.account_id) === String(accountId);
          const legacy = !transaction.account_id && transaction.account === accountName;
          return byId || legacy ? sum + amount : sum;
        }

        if (transaction.type === "expense") {
          const byId = transaction.account_id && String(transaction.account_id) === String(accountId);
          const legacy = !transaction.account_id && transaction.account === accountName;
          return byId || legacy ? sum - amount : sum;
        }

        if (transaction.type === "transfer") {
          const fromById = transaction.from_account_id && String(transaction.from_account_id) === String(accountId);
          const toById = transaction.to_account_id && String(transaction.to_account_id) === String(accountId);
          const fromLegacy = !transaction.from_account_id && transaction.from_account === accountName;
          const toLegacy = !transaction.to_account_id && transaction.to_account === accountName;

          if (fromById || fromLegacy) sum -= amount;
          if (toById || toLegacy) sum += amount;
        }

        return sum;
      }, 0)
    );
  }

  function getAccountBalance(accountId) {
    return window.Utils.roundMoney(getAccountRawBalance(accountId) + getManualAdjustment(accountId));
  }

  function getAccountKind(account) {
    return account?.account_kind || account?.role || account?.kind || "spend";
  }

  function getAccountKindLabel(account) {
    const kind = getAccountKind(account);

    if (kind === "cash") return "Наличные";
    if (kind === "reserve") return "Резерв";
    if (kind === "vault_pool") return "Накопления";
    return account?.is_primary_spend ? "Основной счёт" : "Счёт";
  }

  function getPrimaryAccount() {
    const accounts = window.AppState.state.accounts;

    return (
      accounts.find((account) => Boolean(account.is_primary_spend)) ||
      accounts.find((account) => getAccountKind(account) === "spend") ||
      accounts.find((account) => getAccountKind(account) === "cash") ||
      accounts[0] ||
      null
    );
  }

  function getTotalBalance() {
    return window.Utils.roundMoney(
      window.AppState.state.accounts.reduce((sum, account) => sum + getAccountBalance(account.id), 0)
    );
  }

  async function loadAccounts() {
    try {
      return await window.DB.selectAll("accounts", { orderBy: "sort_order" });
    } catch (error) {
      // На случай если sort_order отсутствует в схеме.
      const { data, error: fallbackError } = await window.DB.client.from("accounts").select("*");
      if (fallbackError) throw fallbackError;
      return Array.isArray(data) ? data : [];
    }
  }

  async function loadAppMeta() {
    try {
      return await window.DB.selectAll("app_meta");
    } catch (error) {
      console.warn("app_meta не загрузился:", error);
      return [];
    }
  }

  async function saveAdjustment(accountId, targetBalance) {
    const rawBalance = getAccountRawBalance(accountId);
    const adjustment = window.Utils.roundMoney(targetBalance - rawBalance);
    const adjustments = parseAdjustments();

    if (Math.abs(adjustment) < 0.005) {
      delete adjustments[accountId];
    } else {
      adjustments[accountId] = adjustment;
    }

    const serialized = JSON.stringify(adjustments);
    window.AppState.setMetaValue(ADJUSTMENTS_KEY, serialized);
    await window.DB.upsertMeta(ADJUSTMENTS_KEY, serialized);
  }

  async function createAccount({ name, kind, isPrimary, targetBalance }) {
    const accounts = window.AppState.state.accounts;
    const nextSortOrder = accounts.reduce((max, account) => Math.max(max, Number(account.sort_order) || 0), 0) + 1;

    if (isPrimary) {
      await window.DB.client.from("accounts").update({ is_primary_spend: false }).neq("id", "");
    }

    const row = await window.DB.insertRow("accounts", {
      id: window.Utils.makeId(),
      name,
      account_kind: kind,
      include_in_free_money: kind !== "reserve" && kind !== "vault_pool",
      is_protected: kind === "reserve",
      is_primary_spend: Boolean(isPrimary),
      subtitle: "",
      sort_order: nextSortOrder,
    });

    window.AppState.state.accounts.push(row);
    await saveAdjustment(row.id, targetBalance);

    return row;
  }

  async function updateAccount(accountId, { name, kind, isPrimary, targetBalance }) {
    if (isPrimary) {
      await window.DB.client.from("accounts").update({ is_primary_spend: false }).neq("id", accountId);
    }

    const patch = {
      name,
      account_kind: kind,
      include_in_free_money: kind !== "reserve" && kind !== "vault_pool",
      is_protected: kind === "reserve",
      is_primary_spend: Boolean(isPrimary),
      subtitle: "",
    };

    const updated = await window.DB.updateRow("accounts", accountId, patch);
    const local = getAccountById(accountId);
    if (local) Object.assign(local, updated);

    await saveAdjustment(accountId, targetBalance);

    return updated;
  }

  window.Accounts = {
    loadAccounts,
    loadAppMeta,
    getAccountById,
    getAccountName,
    getAccountRawBalance,
    getAccountBalance,
    getAccountKind,
    getAccountKindLabel,
    getPrimaryAccount,
    getTotalBalance,
    createAccount,
    updateAccount,
    parseAdjustments,
  };
})();
