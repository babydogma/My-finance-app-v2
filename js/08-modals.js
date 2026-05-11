// 08-modals.js — modal flow and forms.
(() => {
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  function closeModal(modal) {
    const node = typeof modal === "string" ? document.getElementById(modal) : modal;
    if (!node) return;

    node.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  function closeAll() {
    document.querySelectorAll(".modal").forEach(closeModal);
  }

  function fillAccountSelects() {
    const accountSelect = document.getElementById("transactionAccountSelect");
    if (!accountSelect) return;

    accountSelect.innerHTML = window.AppState.state.accounts
      .map((account) => `<option value="${window.Utils.escapeHtml(account.id)}">${window.Utils.escapeHtml(account.name)}</option>`)
      .join("");
  }

  function fillCategorySelect() {
    const categorySelect = document.getElementById("transactionCategorySelect");
    if (!categorySelect) return;

    const options = [`<option value="">Без категории</option>`].concat(
      window.AppState.state.categories.map((category) => {
        return `<option value="${window.Utils.escapeHtml(category.id)}">${window.Utils.escapeHtml(category.name)}</option>`;
      })
    );

    categorySelect.innerHTML = options.join("");
  }

  function openTransactionModal(type) {
    const isIncome = type === "income";

    document.getElementById("transactionTypeInput").value = isIncome ? "income" : "expense";
    document.getElementById("transactionModeLabel").textContent = isIncome ? "Доход" : "Расход";
    document.getElementById("transactionModalTitle").textContent = isIncome ? "Добавить доход" : "Добавить расход";
    document.getElementById("transactionAmountInput").value = "";
    document.getElementById("transactionTitleInput").value = "";
    document.getElementById("transactionDateInput").value = window.Utils.todayDate();
    document.getElementById("transactionCategoryField").classList.toggle("hidden", isIncome);

    fillAccountSelects();
    fillCategorySelect();
    openModal("transactionModal");
  }

  function openAccountModal(accountId = "") {
    const account = accountId ? window.Accounts.getAccountById(accountId) : null;

    document.getElementById("accountIdInput").value = account?.id || "";
    document.getElementById("accountModalTitle").textContent = account ? "Редактировать счёт" : "Новый счёт";
    document.getElementById("accountNameInput").value = account?.name || "";
    document.getElementById("accountKindSelect").value = account ? window.Accounts.getAccountKind(account) : "spend";
    document.getElementById("accountPrimaryInput").checked = Boolean(account?.is_primary_spend);
    document.getElementById("accountBalanceInput").value = account ? String(window.Accounts.getAccountBalance(account.id)).replace(".", ",") : "0";

    openModal("accountModal");
  }

  async function handleTransactionSubmit(event) {
    event.preventDefault();

    const type = document.getElementById("transactionTypeInput").value === "income" ? "income" : "expense";
    const amount = window.Utils.parseMoney(document.getElementById("transactionAmountInput").value);
    const accountId = document.getElementById("transactionAccountSelect").value;
    const categoryId = document.getElementById("transactionCategorySelect").value;
    const title = document.getElementById("transactionTitleInput").value.trim();
    const date = document.getElementById("transactionDateInput").value;

    if (!amount || amount <= 0) {
      window.Utils.toast("Введи сумму.");
      return;
    }

    if (!accountId) {
      window.Utils.toast("Выбери счёт.");
      return;
    }

    const saveButton = document.getElementById("saveTransactionBtn");
    saveButton.disabled = true;

    try {
      await window.Transactions.saveTransaction({ type, amount, accountId, categoryId, title, date });
      closeModal("transactionModal");
      window.WalletScreen.renderAll();
      window.Utils.toast(type === "income" ? "Доход сохранён." : "Расход сохранён.");
    } catch (error) {
      console.error(error);
      window.Utils.toast(error.message || "Ошибка сохранения операции.");
    } finally {
      saveButton.disabled = false;
    }
  }

  async function handleAccountSubmit(event) {
    event.preventDefault();

    const accountId = document.getElementById("accountIdInput").value;
    const name = document.getElementById("accountNameInput").value.trim();
    const kind = document.getElementById("accountKindSelect").value;
    const isPrimary = document.getElementById("accountPrimaryInput").checked;
    const targetBalance = window.Utils.parseMoney(document.getElementById("accountBalanceInput").value);

    if (!name) {
      window.Utils.toast("Введи название счёта.");
      return;
    }

    const saveButton = document.getElementById("saveAccountBtn");
    saveButton.disabled = true;

    try {
      if (accountId) {
        await window.Accounts.updateAccount(accountId, { name, kind, isPrimary, targetBalance });
      } else {
        await window.Accounts.createAccount({ name, kind, isPrimary, targetBalance });
      }

      closeModal("accountModal");
      window.WalletScreen.renderAll();
      window.Utils.toast(accountId ? "Счёт обновлён." : "Счёт создан.");
    } catch (error) {
      console.error(error);
      window.Utils.toast(error.message || "Ошибка сохранения счёта.");
    } finally {
      saveButton.disabled = false;
    }
  }

  function bind() {
    document.querySelectorAll("[data-close-modal]").forEach((node) => {
      node.addEventListener("click", () => closeModal(node.closest(".modal")));
    });

    document.querySelectorAll("[data-open-transaction]").forEach((button) => {
      button.addEventListener("click", () => openTransactionModal(button.dataset.openTransaction));
    });

    document.getElementById("openAccountCreateBtn")?.addEventListener("click", () => openAccountModal());

    document.getElementById("accountsCards")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-edit-account]");
      if (!button) return;

      openAccountModal(button.dataset.editAccount);
    });

    document.getElementById("transactionForm")?.addEventListener("submit", handleTransactionSubmit);
    document.getElementById("accountForm")?.addEventListener("submit", handleAccountSubmit);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAll();
    });
  }

  window.Modals = {
    bind,
    openTransactionModal,
    openAccountModal,
    closeAll,
  };
})();
