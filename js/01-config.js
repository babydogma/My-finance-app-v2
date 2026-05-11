// 01-config.js — only app constants. No UI logic here.
(() => {
  window.AppConfig = {
    supabaseUrl: "https://npjrrstyotancvjdflvl.supabase.co",
    supabaseAnonKey: "sb_publishable_mntROxzfSwKTEK1VUsLGSw_3PxzAJw-",
    metaKeys: {
      accountAdjustments: "account_balance_adjustments_v1",
    },
    defaults: {
      latestTransactionsLimit: 7,
    },
  };
})();
