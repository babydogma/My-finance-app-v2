// 02-supabase.js — Supabase client and low-level DB helpers.
(() => {
  const config = window.AppConfig;

  if (!window.supabase) {
    throw new Error("Supabase CDN не загрузился.");
  }

  const client = window.supabase.createClient(
    config.supabaseUrl,
    config.supabaseAnonKey
  );

  async function selectAll(table, options = {}) {
    let query = client.from(table).select("*");

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending !== false });
    }

    const { data, error } = await query;
    if (error) throw error;

    return Array.isArray(data) ? data : [];
  }

  async function insertRow(table, row) {
    const { data, error } = await client
      .from(table)
      .insert(row)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async function updateRow(table, id, patch) {
    const { data, error } = await client
      .from(table)
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async function upsertMeta(key, value) {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);

    const attempts = [
      () => client.from("app_meta").upsert({ key, value: serialized }, { onConflict: "key" }),
      () => client.from("app_meta").upsert({ id: key, key, value: serialized }, { onConflict: "id" }),
    ];

    let lastError = null;

    for (const attempt of attempts) {
      const { error } = await attempt();
      if (!error) return;
      lastError = error;
    }

    throw lastError || new Error(`Не удалось сохранить app_meta.${key}`);
  }

  window.DB = {
    client,
    selectAll,
    insertRow,
    updateRow,
    upsertMeta,
  };
})();
