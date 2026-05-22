import supabase from "../services/supabase";

/**
 * Devuelve todos los datos crudos necesarios para el dashboard.
 * Las agregaciones (KPIs, mensual, top X) se calculan en el componente con useMemo.
 */
export async function getFinanzasData() {
  const [pedidosRes, decantsRes, clientesRes, proveedoresRes] =
    await Promise.all([
      supabase
        .from("pedidos_botellas")
        .select(
          "id, fecha, sell, buy_total, revenue, margin_pct, cliente_id, proveedor_id, perfume_nombre",
        ),
      supabase
        .from("decants_parciales")
        .select("id, cliente_id, monto, fecha, parfum_id"),
      supabase.from("clientes_admin").select("id, nombre, es_propio"),
      supabase.from("proveedores").select("id, nombre"),
    ]);

  const firstError =
    pedidosRes.error ||
    decantsRes.error ||
    clientesRes.error ||
    proveedoresRes.error;
  if (firstError) throw firstError;

  return {
    pedidos: pedidosRes.data || [],
    decants: decantsRes.data || [],
    clientes: clientesRes.data || [],
    proveedores: proveedoresRes.data || [],
  };
}
