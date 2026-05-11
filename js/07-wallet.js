// 07-wallet.js — wallet screen rendering only.
(() => {
  function accountCardHtml(account) {
    const balance = window.Accounts.getAccountBalance(account.id);
    const balanceClass = balance < 0 ? "balance-negative" : "balance-positive";

    return `
      <article class="account-card" data-account-id="${window.Utils.escapeHtml(account.id)}">
        <div class="account-card__top">
          <div class="account-card__name">
            <strong>${window.Utils.escapeHtml(account.name || "Счёт")}</strong>
            <span>${window.Utils.escapeHtml(window.Accounts.getAccountKindLabel(account))}</span>
          </div>
          <strong class="account-card__amount ${balanceClass}">${window.Utils.escapeHtml(window.Utils.formatMoney(balance))}</strong>
        </div>
        <div class="account-card__bottom">
          <span class="account-card__chip">${account.is_primary_spend ? "основной" : "активный"}</span>
          <button class="account-card__edit" type="button" data-edit-account="${window.Utils.escapeHtml(account.id)}">Редактировать</button>
        </div>
      </article>
    `;
  }

  function transactionRowHtml(transaction) {
    const isIncome = transaction.type === "income";
    const accountName = transaction.account || window.Accounts.getAccountName(transaction.account_id);
    const sign = isIncome ? "+" : "−";

    return `
      <article class="transaction-row transaction-row--${isIncome ? "income" : "expense"}">
        <div class="transaction-row__icon">${isIncome ? "+" : "−"}</div>
        <div class="transaction-row__body">
          <strong>${window.Utils.escapeHtml(window.Transactions.getTransactionTitle(transaction))}</strong>
          <span>${window.Utils.escapeHtml(accountName)} · ${window.Utils.escapeHtml(window.Utils.formatDateShort(window.Transactions.getTransactionDate(transaction)))}</span>
        </div>
        <strong class="transaction-row__amount">${sign}${window.Utils.escapeHtml(window.Utils.formatMoney(transaction.amount))}</strong>
      </article>
    `;
  }

  function renderMainAccount() {
    const primary = window.Accounts.getPrimaryAccount();
    const total = window.Accounts.getTotalBalance();

    document.getElementById("mainAccountTitle").textContent = primary?.name || "Счёт не создан";
    document.getElementById("mainAccountBalance").textContent = primary ? window.Utils.formatMoney(window.Accounts.getAccountBalance(primary.id)) : "0 ₽";
    document.getElementById("accountsCount").textContent = String(window.AppState.state.accounts.length);
    document.getElementById("totalBalance").textContent = window.Utils.formatMoney(total);
  }

  function renderAccounts() {
    const container = document.getElementById("accountsCards");
    const accounts = window.AppState.state.accounts;

    if (!container) return;

    container.innerHTML = accounts.length
      ? accounts.map(accountCardHtml).join("")
      : `<div class="empty-state">Счетов пока нет. Нажми “+ Счёт”.</div>`;
  }

  function renderTransactions() {
    const container = document.getElementById("latestTransactions");
    const countNode = document.getElementById("transactionsCount");
    const latest = window.Transactions.getLatestTransactions();

    if (countNode) {
      countNode.textContent = `${window.AppState.state.transactions.length} операций`;
    }

    if (!container) return;

    container.innerHTML = latest.length
      ? latest.map(transactionRowHtml).join("")
      : `<div class="empty-state">Операций пока нет.</div>`;
  }

  function renderAll() {
    renderMainAccount();
    renderAccounts();
    renderTransactions();
  }

  window.WalletScreen = {
    renderAll,
    renderMainAccount,
    renderAccounts,
    renderTransactions,
  };
})();
