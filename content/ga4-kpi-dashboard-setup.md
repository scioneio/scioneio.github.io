You don't need to hire an analyst to know whether your website is working. You need five things set up correctly, in the right order. This is that order.

### Before you start

- A Google account with admin access to the site
- Ability to add a snippet of code to the site (or a developer who can, briefly)
- About 45 to 60 minutes, uninterrupted

### 1. Create the GA4 property

In Google Analytics, create a new GA4 property for the site. Set the correct time zone and currency now. Both are painful to fix retroactively once data starts collecting.

### 2. Install Google Tag Manager

Install GTM once, then manage every future tag (GA4, ads pixels, anything else) from inside it instead of editing site code each time. Add the GTM container snippet to the site's global header and body, and connect your GA4 property as a tag inside GTM.

### 3. Define the events that actually matter

Don't track everything. Track the handful of actions that indicate real intent. For most small business sites, that's a short list:

- Form submissions (contact, quote request, newsletter signup)
- Sign-up or account creation
- Pricing page views
- Key CTA clicks

### 4. Build the KPI dashboard

In Looker Studio, connect your GA4 property and build one dashboard with just the handful of metrics tied to the events above, skipping the dozens of others GA4 offers by default. A dashboard nobody reads is worse than no dashboard.

### 5. Set a reporting cadence

Put a recurring 15-minute review on the calendar: weekly early on, monthly once things stabilize. The dashboard only matters if someone actually looks at it on a schedule.

## Example: tracking a form submission

Once GTM is installed, firing a custom event for a button click looks like this:

```js
// Fire when the "Request a quote" button is clicked
dataLayer.push({
  event: "quote_request",
  form_location: "hero"
});
```

Set up a GTM trigger that listens for this event, and a GA4 event tag that fires when it does. That single pairing is often 80% of what a small business actually needs to know: did someone try to reach us, and from where.

<div class="callout">
<p><strong>Keep it simple.</strong> Five well-chosen events you actually look at beat fifty you never check. Start small, and add tracking only when a new question actually comes up.</p>
</div>
