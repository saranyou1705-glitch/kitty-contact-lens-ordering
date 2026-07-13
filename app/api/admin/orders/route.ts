import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const customerIds = [...new Set((orders ?? []).map((order) => order.customer_id))];

  let profiles: Array<{ id: string; full_name: string; phone: string }> = [];

  if (customerIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", customerIds);

    profiles = data ?? [];
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return NextResponse.json({
    orders: (orders ?? []).map((order) => ({
      ...order,
      customer: profileMap.get(order.customer_id) ?? null,
    })),
  });
}
