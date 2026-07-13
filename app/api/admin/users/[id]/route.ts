import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const b = await request.json();
  const allowed: any = {};
  if (["pending","approved","rejected","suspended"].includes(b.approvalStatus)) {
    allowed.approval_status = b.approvalStatus;
    allowed.is_active = b.approvalStatus === "approved";
    if (b.approvalStatus === "approved") allowed.approved_at = new Date().toISOString();
  }
  if (["normal","vip","vvip"].includes(b.customerTier)) allowed.customer_tier = b.customerTier;
  if (["customer","packer","admin","super_admin"].includes(b.role)) allowed.role = b.role;

  const s = createAdminClient();
  const { data: oldData } = await s.from("profiles").select("*").eq("id", id).maybeSingle();
  const { data, error } = await s.from("profiles").update(allowed).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await s.from("audit_logs").insert({
    action: "update_user",
    entity_type: "profile",
    entity_id: id,
    old_data: oldData,
    new_data: data,
    actor_role: "admin",
  });

  return NextResponse.json({ success: true, item: data });
}
