# Cartiae Rae — What We Found, and What We Fixed

**A plain-English summary. No technical knowledge needed.**
14 August 2026

---

## The short version

We checked the whole website — the shop, the payments, the admin area, and the
customer records. We found **one serious problem and several smaller ones**, and
we have fixed them.

The serious one is worth understanding, because it involved real money.
Everything else was either invisible to customers or a tidy-up.

The website is safe to take payments today. Two small jobs remain before it can
be handed over, and neither needs a developer.

---

## The serious problem: customers could choose their own price

**What was wrong**

Imagine a shop where the till doesn't have a price list. Instead, each customer
writes the price on a slip of paper and hands it over, and the till simply
charges whatever the slip says.

That is effectively how the online shop worked. When someone clicked "buy", their
own computer told the payment system what the price should be — and the payment
system believed it.

Anyone who knew how to do this could have bought a **$24.99 eBook for 50 cents**.
The same trick worked on discounts: someone could invent a "99% off" code that
never existed, and it would have been accepted.

This was live, on the real payment account, with real money.

**What we did**

The till now has a proper price list. The customer's computer can only say
*which* item they want and *how many* — never the price. The website looks the
price up itself and charges that.

**How we know it works**

We tried to cheat it. We sent an order pretending a $24.99 eBook cost 50 cents,
with a made-up 99% discount code attached. Then we opened the real payment page
to see what it would actually charge.

It charged **$24.99**. Both tricks were ignored.

We also checked what happens if someone invents a product that doesn't exist —
the shop refuses the sale rather than guessing.

---

## The second problem: sales weren't being recorded

**What was wrong**

When a customer paid, nothing wrote that sale down. The money would arrive, but
the shop would have no record of who bought what, and no way to send them their
eBook.

Normally this is solved by the payment company sending a notification to the
website. But setting that up requires access to the Stripe account, which you
don't currently have.

**What we did**

We built it a different way that doesn't need that access. When a customer
finishes paying and returns to the "thank you" page, the website asks the payment
company directly: *"did this person really pay?"* — and only writes the sale down
if the answer is yes.

We also added a safety net. If a customer pays and then closes their browser
before coming back, that sale could be missed. So every time you open the admin
area, the website quietly checks the payment company for anything it missed in
the last 90 days and adds it in. If it finds anything, it tells you.

**How we know it works**

We created a real order but didn't pay for it, then asked the website to record
it. It correctly refused, saying the checkout hadn't been paid. We also tried
feeding it a completely made-up order — it refused that too.

The safety net is locked to administrators only. We tried running it with no
password and with a fake one; both were turned away.

---

## Fake information was showing as if it were real

Three things looked like genuine customer activity but had been invented:

**Two fake customer orders.** "Aria Carter" and "Shayla Jenkins" appeared in your
orders list with addresses, phone numbers and payments. Neither person exists.
They were written into the website as examples and never removed.

**Fake likes and comments on every video.** All 17 videos showed invented view
counts, and the *same three comments from the same three people* appeared under
every single one — visible to every visitor.

**Fake five-star reviews** on products and eBooks, with quotes attributed to
named customers who don't exist.

All three are now hidden whenever the real website is running. They still appear
in the practice/demo version, so previews look natural.

---

## Two smaller fixes

**A filing mix-up in the sales records.** The system that stores sales expects
prices in cents (2499 rather than $24.99). Our first attempt sent dollars, which
would have quietly rounded every price to the nearest whole number — $24.99
becoming $25.00 on every order. We caught and corrected this before a single real
sale went through, so no money or records were affected.

**A small security gap** on the Services page, where text typed into the admin
area could have been misused. Closed.

---

## What still needs doing

Neither of these needs a developer.

### 1. Upload the eBook files

The shop can sell the three eBooks, but the actual PDF files haven't been
uploaded yet. Until they are, a customer would pay and receive nothing.

They need to go into the secure storage area of the website's database, under
these exact names:

- `4c_growth_blueprint_cartiae_rae.pdf`
- `wash_day_mastery_cartiae_rae.pdf`
- `protective_styles_playbook.pdf`

The files are kept private. Customers never get a direct link to them — instead
each buyer receives a personal link that stops working after 24 hours, so it
can't be passed around.

### 2. Make one real test purchase

Every individual piece has been tested, but no genuine paid order has gone all
the way through yet. Buying one eBook yourself would confirm the whole chain:
payment taken, sale recorded, download delivered, order visible in your admin
area.

This is the last step before the shop can be considered proven rather than just
ready.

---

## Two things to think about later

Neither is urgent. Both are worth knowing about.

**Everyone with admin access can do everything.** There's no way to give someone
limited access — for example, letting an assistant add photos but not see sales
figures or customer details. Fine while one person runs everything; worth
revisiting before anyone else is given a login.

**Website edits are saved to one computer first.** When you change your products
or photos, those changes are stored on the computer you're working on, and
published to the live site when you press sync. If two people edit from two
different computers, the last one to publish wins and the other's work is lost.
Also worth knowing: clearing your browser history could lose unpublished changes.
Publish when you finish a session, and you'll be fine.

---

## In one sentence

The shop was taking real money while letting customers set their own prices —
that's fixed and proven; sales are now recorded properly without needing Stripe
access; the invented customers and reviews are gone; and what's left is uploading
three files and making one test purchase.
