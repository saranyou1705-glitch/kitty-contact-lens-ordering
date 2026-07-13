import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json(
        { error: "รหัสรายการชำระเงินไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const action = String(body.action ?? "");
    const reason = String(body.reason ?? "").trim();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "คำสั่งตรวจสอบไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "กรุณาระบุเหตุผล" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: batch, error: batchError } = await supabase
      .from("payment_batches")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: batchError?.message ?? "ไม่พบรายการชำระเงิน" },
        { status: 404 },
      );
    }

    if (!batch.slip_image_url) {
      return NextResponse.json(
        { error: "ยังไม่มีหลักฐานการโอนเงิน" },
        { status: 400 },
      );
    }

    const currentStatus =
      batch.verification_status ?? batch.status ?? "not_submitted";

    if (["approved", "paid"].includes(currentStatus)) {
      return NextResponse.json(
        { error: "รายการนี้ได้รับการยืนยันแล้ว" },
        { status: 400 },
      );
    }

    const { data: links, error: linksError } = await supabase
      .from("payment_batch_orders")
      .select("order_id, amount_applied")
      .eq("payment_batch_id", id);

    if (linksError) {
      return NextResponse.json(
        { error: linksError.message },
        { status: 500 },
      );
    }

    const now = new Date().toISOString();

    if (action === "approve") {
      for (const link of links ?? []) {
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("id, final_total, total_amount, paid_amount")
          .eq("id", link.order_id)
          .maybeSingle();

        if (orderError || !order) {
          return NextResponse.json(
            { error: orderError?.message ?? "ไม่พบออเดอร์ในรายการชำระ" },
            { status: 500 },
          );
        }

        const finalTotal = Number(
          order.final_total ?? order.total_amount ?? 0,
        );
        const oldPaid = Number(order.paid_amount ?? 0);
        const applied = Number(link.amount_applied ?? 0);
        const newPaid = Math.min(finalTotal, oldPaid + applied);
        const outstanding = Math.max(0, finalTotal - newPaid);
        const paymentStatus =
          outstanding === 0 ? "paid" : newPaid > 0 ? "partially_paid" : "unpaid";

        const { error: updateOrderError } = await supabase
          .from("orders")
          .update({
            paid_amount: newPaid,
            outstanding_amount: outstanding,
            payment_status: paymentStatus,
            updated_at: now,
          })
          .eq("id", link.order_id);

        if (updateOrderError) {
          return NextResponse.json(
            { error: updateOrderError.message },
            { status: 500 },
          );
        }
      }

      const { error: updateBatchError } = await supabase
        .from("payment_batches")
        .update({
          status: "paid",
          verification_status: "approved",
          verification_message: "ร้านค้ายืนยันการรับยอดแล้ว",
          review_reason: reason,
          checked_at: now,
          updated_at: now,
        })
        .eq("id", id);

      if (updateBatchError) {
        return NextResponse.json(
          { error: updateBatchError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        status: "approved",
        message: "ยืนยันการชำระเงินแล้ว",
      });
    }

    for (const link of links ?? []) {
      await supabase
        .from("orders")
        .update({
          payment_status: "unpaid",
          updated_at: now,
        })
        .eq("id", link.order_id)
        .neq("payment_status", "paid");
    }

    const { error: rejectError } = await supabase
      .from("payment_batches")
      .update({
        status: "rejected",
        verification_status: "rejected",
        verification_message: "หลักฐานการโอนไม่ผ่านการตรวจสอบ",
        review_reason: reason,
        checked_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (rejectError) {
      return NextResponse.json(
        { error: rejectError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      status: "rejected",
      message: "ปฏิเสธหลักฐานการโอนแล้ว",
    });
  } catch (error) {
    console.error("payment batch review error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดระหว่างตรวจสอบการชำระเงิน",
      },
      { status: 500 },
    );
  }
}
