import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STATUS_LABELS: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Order Confirmed",
  baking: "Being Prepared",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_EMOJI: Record<string, string> = {
  placed: "📋",
  confirmed: "✅",
  baking: "👨‍🍳",
  out_for_delivery: "🚚",
  delivered: "🎉",
  cancelled: "❌",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase config missing');

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { orderId, newStatus, customerEmail, customerName, orderTotal, items, userId, isTest } = await req.json();

    if (!orderId || !newStatus) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email notifications are enabled for this status
    const { data: configData } = await supabaseAdmin
      .from("store_config")
      .select("is_active")
      .eq("config_type", "email_notification")
      .eq("value", newStatus)
      .maybeSingle();

    // If a config exists and is explicitly disabled, skip sending
    if (configData && configData.is_active === false) {
      console.log(`Email notification disabled for status: ${newStatus}`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Notifications disabled for this status" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve customer email
    let email = customerEmail;
    if (!email && userId) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      email = userData?.user?.email;
    }

    // For test emails, send to the requesting user (admin)
    if (isTest && !email) {
      // Try to get admin email from the auth header
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        email = user?.email;
      }
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Could not resolve customer email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const statusLabel = STATUS_LABELS[newStatus] || newStatus;
    const statusEmoji = STATUS_EMOJI[newStatus] || "📦";
    const name = customerName || "Customer";
    const shortId = isTest ? "TEST0000" : orderId.slice(0, 8).toUpperCase();

    const itemsHtml = Array.isArray(items) && items.length > 0
      ? items.map((item: any) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;">${item.name || 'Item'} (${item.weight || ''})</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:center;">${item.quantity || 1}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
          </tr>`
        ).join('')
      : '';

    const testBanner = isTest ? `<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px;margin-bottom:16px;text-align:center;font-size:13px;color:#856404;">⚠️ This is a test email — no real order was placed</div>` : '';

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <span style="font-size:28px;">🧁</span>
          <span style="font-size:22px;font-weight:700;color:#1a1a1a;margin-left:8px;">Sweet<span style="color:#e85d75;">Crumbs</span></span>
        </div>

        ${testBanner}

        <div style="background:#fdf2f4;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
          <div style="font-size:48px;margin-bottom:12px;">${statusEmoji}</div>
          <h1 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;">${statusLabel}</h1>
          <p style="margin:0;color:#666;font-size:14px;">Order #${shortId}</p>
        </div>

        <div style="background:#f9f9f9;border-radius:12px;padding:24px;margin-bottom:24px;">
          <p style="margin:0 0 16px;font-size:15px;color:#333;">Hi <strong>${name}</strong>,</p>
          <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">
            ${newStatus === 'placed' ? 'Thank you for your order! We\'ve received it and will start preparing it soon.' :
              newStatus === 'confirmed' ? 'Great news! Your order has been confirmed and our team is getting ready.' :
              newStatus === 'baking' ? 'Your cake is being freshly prepared by our expert bakers!' :
              newStatus === 'out_for_delivery' ? 'Your order is on its way! Our delivery partner is bringing your cake to you.' :
              newStatus === 'delivered' ? 'Your order has been delivered! We hope you enjoy every bite. 🎂' :
              newStatus === 'cancelled' ? 'Your order has been cancelled. If you have questions, please contact us.' :
              `Your order status has been updated to: ${statusLabel}.`}
          </p>
        </div>

        ${itemsHtml ? `
        <div style="margin-bottom:24px;">
          <h3 style="font-size:15px;font-weight:600;color:#333;margin:0 0 12px;">Order Items</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;">Item</th>
                <th style="padding:8px 12px;text-align:center;font-size:12px;color:#888;font-weight:600;">Qty</th>
                <th style="padding:8px 12px;text-align:right;font-size:12px;color:#888;font-weight:600;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          ${orderTotal ? `<div style="text-align:right;margin-top:12px;font-size:16px;font-weight:700;color:#1a1a1a;">Total: ₹${Number(orderTotal).toLocaleString()}</div>` : ''}
        </div>` : ''}

        <div style="text-align:center;padding-top:24px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#999;">FluffiePie • Fresh cakes, delivered with love</p>
          <p style="margin:4px 0 0;font-size:12px;color:#bbb;">${isTest ? 'Test notification' : `Automated notification for order #${shortId}`}</p>
        </div>
      </div>
    </body>
    </html>`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SweetCrumbs <onboarding@resend.dev>',
        to: [email],
        subject: `${isTest ? '[TEST] ' : ''}${statusEmoji} Order #${shortId} — ${statusLabel}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error('Resend API error:', resendData);
      throw new Error(`Resend API failed [${resendRes.status}]: ${JSON.stringify(resendData)}`);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending order notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
