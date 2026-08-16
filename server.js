/* ======================================================
   Campground Guides Checkout Routes - checkout.js
   Clean, stable version with proper OPTIONS handling for CORS
   ====================================================== */

import express from "express";
import sgMail from "@sendgrid/mail";
import Stripe from "stripe";

const router = express.Router();

// ----------------------
// OPTIONS Preflight Handler (CRITICAL FOR CORS)
// ----------------------
router.options("*", (req, res) => {
  res.sendStatus(200);
});

// ----------------------
// Stripe Setup
// ----------------------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ----------------------
// Create Checkout Session
// ----------------------
router.post("/create-checkout", async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.priceId || !payload.metadata) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: payload.priceId,
          quantity: 1,
        },
      ],
      metadata: payload.metadata,
      success_url: payload.successUrl,
      cancel_url: payload.cancelUrl,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe Checkout Error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// ----------------------
// Export Router
// ----------------------
export default router;

// ----------------------
// Utility Helpers
// ----------------------
function normalizeEmail(email) {
  return email ? String(email).trim().toLowerCase() : "";
}

// ----------------------
// Referral Route (POST)
// ----------------------
app.post("/api/referrals", async (req, res) => {
  try {
    const {
      referrer_name,
      referrer_last_name,
      referrer_email,
      business,
      dm_name,
      dm_email,
      dm_phone_number,
      relationship,
      permission,
    } = req.body;

    // Validate required fields
    if (
      !referrer_name ||
      !referrer_last_name ||
      !referrer_email ||
      !business ||
      !dm_name ||
      !dm_email ||
      !relationship ||
      permission !== "yes"
    ) {
 HEAD
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields." });

    }

    // Save referral to MongoDB (mapping new fields to legacy schema)
    const referral = new Referral({
      referrerName: `${referrer_name} ${referrer_last_name}`,
      referrerEmail: normalizeEmail(referrer_email),

      // Legacy fields mapped to new meaning
      friendName: dm_name,
      friendEmail: normalizeEmail(dm_email),

      business,
      dmPhoneNumber: dm_phone_number,
      source: "referral-form",
      status: "submitted",
    });

    await referral.save();

    // ----------------------
    // Send Emails
    // ----------------------

    // Thank-you email to referrer
    await sgMail.send({
      to: referrer_email,
      from: FROM_EMAIL,
      subject: "Thank you for your referral!",
      text: `Hi ${referrer_name},

Thank you for referring ${business} to Campground Guides! We appreciate your support.

— Campground Guides Team`,
    });

    // Heads-up email to the referred business
 HEAD
    await sgMail.send({
      to: dm_email,
      from: FROM_EMAIL,
      subject: "You were recommended to Campground Guides",
      text: `Hi ${dm_name},

You were recommended to us by someone who thinks highly of your business. At Campground Guides, we help RV travelers discover great local businesses through our digital guest service app.

We’d love to show you how your business could appear on our interactive map — complete with photos, videos, and your story.

If you’d like a quick 15‑minute walkthrough, you can schedule here:
[Calendar Link]

Warm regards,
Wade & Diana Wilson
Campground Guides`,
 HEAD
    });


    // Admin notification (full details)
    const adminMsg = {
      to: "info@campgroundguides.com",
      from: FROM_EMAIL,
      subject: "New Advertiser Referral Submitted",
      text: `A new advertiser referral has been submitted.

Referring Party: ${referrer_name} ${referrer_last_name}
Referrer Email: ${referrer_email}

Business (Referrer): ${business}

Decision Maker: ${dm_name}
Decision Maker Email: ${dm_email}
Decision Maker Phone: ${dm_phone_number}

Relationship: ${relationship}
Permission to Contact: ${permission}

Submitted via Campground Guides Referral Form.`,
    };

    await sgMail.send(adminMsg);

 HEAD
    res
      .status(200)
      .json({ success: true, message: "Referral submitted successfully." });
  } catch (err) {
    console.error("Referral error:", err);
    res
      .status(500)
      .json({ error: "Server error while submitting referral." });

  }
});

// ----------------------
// Health Check
// ----------------------
app.get("/health", (req, res) => {
  const health = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  };
  res.status(200).json(health);
});

// ----------------------
// Root Route
// ----------------------
app.get("/", (req, res) => {
  res.send("Campground Guides Referral API is running.");
});

// ----------------------
// Start Server
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Campground Guides Referral API running on port ${PORT}`);
});
