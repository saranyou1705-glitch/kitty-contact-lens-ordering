import { SupabaseClient } from "@supabase/supabase-js";

type Bucket = "warehouse" | "packed" | "shipped" | "delivered";

const fieldByBucket: Record<Bucket, string> = {
  warehouse: "warehouse_qty",
  packed: "packed_qty",
  shipped: "shipped_qty",
  delivered: "delivered_qty",
};

export async function ensureInventoryBalance(supabase: SupabaseClient, variantId: string) {
  const { data, error } = await supabase
    .from("inventory_balances")
    .select("*")
    .eq("variant_id", variantId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return data;

  const { data: created, error: createError } = await supabase
    .from("inventory_balances")
    .insert({ variant_id: variantId })
    .select("*")
    .single();
  if (createError) throw new Error(createError.message);
  return created;
}

export async function transferInventory(args: {
  supabase: SupabaseClient;
  variantId: string;
  quantity: number;
  from: Bucket;
  to: Bucket;
  movementType: "pack" | "unpack" | "ship" | "receive";
  orderId?: string;
  actorId?: string | null;
  actorRole?: string | null;
  note?: string;
}) {
  const { supabase, variantId, quantity, from, to } = args;
  if (!Number.isInteger(quantity) || quantity <= 0 || from === to) return;

  const balance = await ensureInventoryBalance(supabase, variantId);
  const fromField = fieldByBucket[from];
  const toField = fieldByBucket[to];
  const available = Number(balance[fromField] ?? 0);
  if (available < quantity) {
    throw new Error(`สต๊อค ${from} ไม่พอ: มี ${available} ต้องใช้ ${quantity}`);
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("inventory_balances")
    .update({
      [fromField]: available - quantity,
      [toField]: Number(balance[toField] ?? 0) + quantity,
      updated_at: now,
    })
    .eq("variant_id", variantId);
  if (updateError) throw new Error(updateError.message);

  const { error: movementError } = await supabase
    .from("inventory_movements")
    .insert({
      variant_id: variantId,
      movement_type: args.movementType,
      from_bucket: from,
      to_bucket: to,
      quantity,
      order_id: args.orderId ?? null,
      actor_id: args.actorId ?? null,
      actor_role: args.actorRole ?? null,
      note: args.note ?? null,
      occurred_at: now,
    });
  if (movementError) throw new Error(movementError.message);
}
