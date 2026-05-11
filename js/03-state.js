// 03-state.js — single predictable state container.
(() => {
  const state = {
    accounts: [],
    transactions: [],
    categories: [],
    appMeta: [],
    loading: false,
  };

  function set(partial) {
    Object.assign(state, partial);
    document.dispatchEvent(new CustomEvent("app:state-change", { detail: state }));
  }

  function getMetaRow(key) {
    return state.appMeta.find((row) => {
      return row?.key === key || row?.id === key || row?.name === key || row?.meta_key === key;
    }) || null;
  }

  function getMetaValue(key, fallback = "") {
    const row = getMetaRow(key);

    if (!row) return fallback;

    return row.value ?? row.meta_value ?? row.data ?? fallback;
  }

  function setMetaValue(key, value) {
    let row = getMetaRow(key);

    if (!row) {
      row = { key, value };
      state.appMeta.push(row);
      return;
    }

    row.key = key;
    row.value = value;
  }

  window.AppState = {
    state,
    set,
    getMetaValue,
    setMetaValue,
  };
})();
