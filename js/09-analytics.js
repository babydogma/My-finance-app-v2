// 09-analytics.js — tiny derived values. No UI side effects outside this module.
(() => {
  function getIncomeTotal() {
    return window.Utils.roundMoney(
      window.AppState.state.transactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    );
  }

  function getExpenseTotal() {
    return window.Utils.roundMoney(
      window.AppState.state.transactions
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    );
  }

  window.Analytics = {
    getIncomeTotal,
    getExpenseTotal,
  };
})();
