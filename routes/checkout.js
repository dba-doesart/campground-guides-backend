/* ======================================================
   Campground Guides Checkout Routes - checkout.js
   Clean, stable version with proper OPTIONS handling for CORS
   ====================================================== */

import express from "express";
import sgMail from "@sendgrid/mail";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ----------------------
// REMOVED OPTIONS Preflight Handler (CRITICAL FOR CORS)
// ----------------------

// Tennessee Product IDs (metadata only)
const productIds = {
  "Cherokee Dam Campground": "prod_T1IHVoct838VPf",
  "Greenlee of May Springs": "prod_TFoxoMQJjPsPBM",
  "Greenlee - Original Campground": "prod_TFpKWzm03F6Nn4",
  "Melton Hill Dam Campground": "prod_T1ILUnX3savDp8",
  "Yarberry Campground": "prod_T1IMdXTVqc4CFT",
  "Headwater and Tailwater Campgrounds": "prod_V4Vs60hPRmGhT3",
  "Two Rivers Landing": "prod_V48vzUfNo17gK9"
};

// Multi‑park pricing table
const PRICE_TABLE = {
  monthly: {
    1: "price_1U47y2Hw2ZCjSnG408sI7KX1",
    2: "price_1U46FjHw2ZCjSnG4luCpj0BA",
    3: "price_1U46QoHw2ZCjSnG4LbXG0l6r",
    4: "price_1U475eHw2ZCjSnG4iYd7hbSG",
    5: "price_1U479gHw2ZCjSnG4SO9fcR2T",
    6: "price_1U47HDHw2ZCjSnG4SV0YeJoB",
    7: "price_1U47OCHw2ZCjSnG47Vjr2Nls",
    8: "price_1U47Y7Hw2ZCjSnG4yfsQ29Cz"
  },
  annual: {
    1: "price_1U4807Hw2ZCjSnG4Up02k2Yk",
    2: "price_1U46MTHw2ZCjSnG4L50UoDfq",
    3: "price_1U46SNHw2ZCjSnG4iiFeF2DD",
    4: "price_1U477PHw2ZCjSnG45dOI5Mnt",
    5: "price_1U47DhHw2ZCjSnG4zFlnHZSm",
    6: "price_1U47JnHw2ZCjSnG48NWpH5vb",
    7: "price_1U47UjHw2ZCjSnG4Q6nEj6YA",
    8: "price_1U47cVHw2ZCjSnG4Y7zyaerS"
  }
};

// ⭐ Updated flexible checkout route
router.post("/create-checkout", async (req, res) => {
  try {
    // Accept multiple possible field names from the frontend
    const selectedParks =
      req.body.selectedParks ||
      req.body.parks ||
      req.body.selected ||
      req.body.parkList ||
      [];

    const billingCycle =
      req.body.billingCycle ||
      req.body.cycle ||
      req.body.billing ||
      req.body.subscriptionType ||
      "monthly";

    const email =
      req.body.email ||
      req.body.emailAddress ||
      req.body.customerEmail ||
      req.body.contact ||
      null;

    // Validate parks
    if (!Array.isArray(selectedParks) || selectedParks.length === 0) {
      return res.status(400).json({ error: "No parks selected" });
    }

    // Validate billing cycle
    if (!["monthly", "annual"].includes(billingCycle)) {
      return res.status(400).json({ error: "Invalid billing cycle" });
    }

    // Validate email
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Count parks
    const parkCount = selectedParks.length;

    // Get correct price ID
    const priceId = PRICE_TABLE[billingCycle][parkCount];

    if (!priceId) {
      return res.status(400).json({ error: "Invalid park count or billing cycle" });
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      customer_email: email,
      metadata: {
        parks_selected: selectedParks.join(", "),
        product_ids: selectedParks.map(p => productIds[p]).join(", "),
        park_count: parkCount,
        billing_cycle: billingCycle
      },
      success_url: process.env.SUCCESS_URL,
      cancel_url: process.env.CANCEL_URL
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Unable to create checkout session" });
  }
});

export default router;
