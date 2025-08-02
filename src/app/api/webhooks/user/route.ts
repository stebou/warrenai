// src/app/api/webhooks/user/route.ts
import { Webhook } from "svix";
import { db } from "@/lib/db";

export const runtime = "edge"; // si tu utilises Edge, sinon retire

export async function POST(req: Request) {
  console.log("[webhook] received");

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] CLERK_WEBHOOK_SECRET not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const bodyText = await req.text();

  // Collect only the Svix headers needed, keeping casing per svix lib expectations (lowercase)
  const headers: Record<string, string> = {
    "svix-id": req.headers.get("svix-id") || "",
    "svix-timestamp": req.headers.get("svix-timestamp") || "",
    "svix-signature": req.headers.get("svix-signature") || "",
  };

  const wh = new Webhook(secret);
  let evt: any;
  try {
    evt = wh.verify(bodyText, headers);
    console.log("[webhook] verified:", evt.type);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return new Response("Invalid signature", { status: 401 });
  }

  const { id, email_addresses, first_name, last_name } = evt.data || {};

  try {
    if (evt.type === "user.created" || evt.type === "user.updated") {
      const email = email_addresses?.[0]?.email_address ?? null;
      const name = [first_name, last_name].filter(Boolean).join(" ").trim() || null;

      if (!id) {
        console.warn("[webhook] missing user id in event data");
        return new Response("Bad event payload", { status: 400 });
      }

      await db.user.upsert({
        where: { clerkId: id },
        update: {
          ...(email ? { email } : {}),
          ...(name ? { name } : {}),
        },
        create: {
          clerkId: id,
          email,
          name,
        },
      });
      console.log("[webhook] upserted user", id);
    } else if (evt.type === "user.deleted") {
      if (!id) {
        console.warn("[webhook] missing user id for deletion");
        return new Response("Bad event payload", { status: 400 });
      }
      await db.user.delete({
        where: { clerkId: id },
      });
      console.log("[webhook] deleted user", id);
    } else {
      // Event type non géré explicitement : retour 200 pour ack
      console.log("[webhook] unhandled event type", evt.type);
    }
  } catch (dbError) {
    console.error("[webhook] database operation failed:", dbError);
    return new Response("Database error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}