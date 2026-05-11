// 10-main.js — app bootstrap. This is the only startup file.
(() => {
  async function loadData() {
    window.Utils.setLoading(true);

    try {
      const [accounts, transactions, categories, appMeta] = await Promise.all([
        window.Accounts.loadAccounts(),
        window.Transactions.loadTransactions(),
        window.Transactions.loadCategories(),
        window.Accounts.loadAppMeta(),
      ]);

      window.AppState.set({ accounts, transactions, categories, appMeta });
      window.WalletScreen.renderAll();
    } catch (error) {
      console.error(error);
      window.Utils.toast(error.message || "Ошибка загрузки данных.");
    } finally {
      window.Utils.setLoading(false);
    }
  }

  function bindGlobalEvents() {
    document.getElementById("refreshAppBtn")?.addEventListener("click", loadData);
  }

  async function start() {
    window.Modals.bind();
    bindGlobalEvents();
    await loadData();
  }

  window.App = {
    start,
    loadData,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
