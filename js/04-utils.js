// 04-utils.js — pure utilities only.
(() => {
  function makeId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
      const random = Math.random() * 16 | 0;
      const value = char === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  function roundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  function parseMoney(value) {
    const normalized = String(value || "")
      .trim()
      .replace(/\s+/g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? roundMoney(parsed) : 0;
  }

  function formatMoney(value) {
    const amount = roundMoney(value);

    return `${new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: amount % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(amount)} ₽`;
  }

  function todayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function nowTimeLabel() {
    return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }

  function dateToCreatedAt(dateValue) {
    const date = dateValue || todayDate();
    const time = new Date().toTimeString().slice(0, 8);

    return `${date}T${time}`;
  }

  function formatDateShort(value) {
    if (!value) return "";
    const raw = String(value).slice(0, 10);
    const [year, month, day] = raw.split("-");

    if (!year || !month || !day) return "";
    return `${day}.${month}.${String(year).slice(-2)}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toast(message) {
    const node = document.getElementById("toast");
    if (!node) return;

    node.textContent = message;
    node.classList.add("is-visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => node.classList.remove("is-visible"), 2200);
  }

  function setLoading(isLoading) {
    document.body.classList.toggle("loading-mask", Boolean(isLoading));
  }

  window.Utils = {
    makeId,
    roundMoney,
    parseMoney,
    formatMoney,
    todayDate,
    nowTimeLabel,
    dateToCreatedAt,
    formatDateShort,
    escapeHtml,
    toast,
    setLoading,
  };
})();
