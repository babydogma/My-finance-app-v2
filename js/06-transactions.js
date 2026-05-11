// 06-transactions.js — transaction loading and saving.
(() => {
  async function loadTransactions() {
    try {
      return await window.DB.selectAll("transactions", { orderBy: "created_at", ascending: false });
    } catch (error) {
      const { data, error: fallbackError } = await window.DB.client.from("transactions").select("*");
      if (fallbackError) throw fallbackError;
      return Array.isArray(data) ? data : [];
    }
  }

  async function loadCategories() {
    try {
      return await window.DB.selectAll("categories", { orderBy: "sort_order" });
    } catch (error) {
      console.warn("categories не загрузились:", error);
      return [];
    }
  }

  function getTransactionTitle(transaction) {
    return transaction.title || transaction.comment || (transaction.type === "income" ? "Доход" : "Расход");
  }

  function getTransactionDate(transaction) {
    return transaction.created_at || transaction.date || transaction.transaction_date || "";
  }

  function getLatestTransactions(limit = window.AppConfig.defaults.latestTransactionsLimit) {
    return [...window.AppState.state.transactions]
      .sort((a, b) => new Date(getTransactionDate(b)).getTime() - new Date(getTransactionDate(a)).getTime())
      .slice(0, limit);
  }

  async function saveTransaction({ type, amount, accountId, categoryId, title, date }) {
    const account = window.Accounts.getAccountById(accountId);
    if (!account) throw new Error("Счёт не найден.");

    const transaction = {
      id: window.Utils.makeId(),
      type,
      title: title || (type === "income" ? "Новый доход" : "Новая трата"),
      amount,
      account_id: account.id,
      account: account.name,
      category_id: type === "expense" ? (categoryId || null) : null,
      from_account_id: null,
      to_account_id: null,
      from_account: null,
      to_account: null,
      from_safe_bucket_id: null,
      to_safe_bucket_id: null,
      created_at: window.Utils.dateToCreatedAt(date),
      time_label: window.Utils.nowTimeLabel(),
    };

    const row = await window.DB.insertRow("transactions", transaction);
    window.AppState.state.transactions.unshift(row);

    return row;
  }

  window.Transactions = {
    loadTransactions,
    loadCategories,
    getLatestTransactions,
    getTransactionTitle,
    getTransactionDate,
    saveTransaction,
  };
})();
