# Monetization Features

## Overview

The Book Club application includes comprehensive monetization features:
- **Subscription Tiers** (Free, Premium, Pro)
- **Stripe Payment Integration**
- **Affiliate Book Links**
- **Subscription Management**

---

## Subscription Tiers

### Free Tier
**Price:** $0/month

**Features:**
- ✓ Basic book reviews
- ✓ 3 reading lists
- ✓ Create 5 spaces
- ✓ Join public forums
- ✓ Text chat
- ✓ Standard AI recommendations

**Limitations:**
- ✗ Ads may be displayed
- ✗ Basic AI features only
- ✗ No video chat
- ✗ No custom themes

### Premium Tier
**Price:** $9.99/month

**Features:**
- ✓ Ad-free experience
- ✓ Enhanced AI recommendations
- ✓ Access to exclusive forums
- ✓ Video chat capability
- ✓ Up to 10 reading lists
- ✓ Create up to 20 spaces
- ✓ **7-day free trial**

**Best For:** Regular readers who want enhanced features

### Pro Tier
**Price:** $19.99/month

**Features:**
- ✓ All Premium features
- ✓ Custom themes
- ✓ Priority support
- ✓ Unlimited reading lists
- ✓ Unlimited spaces
- ✓ Early access to new features
- ✓ Bulk import tools
- ✓ **7-day free trial**

**Best For:** Power users and book clubs

---

## Stripe Integration

### Setup

1. **Create Stripe Account**
   - Visit [stripe.com](https://stripe.com)
   - Sign up for an account
   - Complete business verification

2. **Get API Keys**
   - Dashboard → Developers → API Keys
   - Copy Secret Key (sk_test_...)
   - Copy Publishable Key (pk_test_...)

3. **Create Products & Prices**
   ```
   Dashboard → Products → Add Product
   
   Premium Plan:
   - Name: Premium
   - Price: $9.99/month
   - Recurring: Monthly
   - Copy Price ID (price_...)
   
   Pro Plan:
   - Name: Pro
   - Price: $19.99/month
   - Recurring: Monthly
   - Copy Price ID (price_...)
   ```

4. **Configure Webhook**
   ```
   Dashboard → Developers → Webhooks → Add Endpoint
   
   Endpoint URL: https://yourdomain.com/api/payments/webhook
   
   Events to listen:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   
   Copy Webhook Secret (whsec_...)
   ```

5. **Update Environment Variables**
   ```env
   # Backend .env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PREMIUM_PRICE_ID=price_premium...
   STRIPE_PRO_PRICE_ID=price_pro...
   FRONTEND_URL=http://localhost:3000
   
   # Frontend .env
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### Testing

**Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155

Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Webhook Testing:**
```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:5000/api/payments/webhook

# Trigger test events
stripe trigger customer.subscription.created
```

---

## Affiliate Links

### Supported Platforms

1. **Amazon Associates**
   - Commission: ~4%
   - Requires ISBN
   - Sign up: [affiliate-program.amazon.com](https://affiliate-program.amazon.com)

2. **Bookshop.org**
   - Commission: 10%
   - Supports independent bookstores
   - Sign up: [bookshop.org/affiliates](https://bookshop.org/affiliates)

3. **Barnes & Noble**
   - Commission: ~5%
   - Large retail network
   - Sign up: [barnesandnoble.com/affiliates](https://barnesandnoble.com/affiliates)

### Configuration

```env
# Backend .env
AMAZON_AFFILIATE_TAG=your-affiliate-tag-20
BOOKSHOP_AFFILIATE_TAG=your-bookshop-tag
BN_AFFILIATE_TAG=your-bn-tag
```

### How It Works

1. User views book details
2. Clicks "Buy" button for preferred retailer
3. System generates affiliate link with your tag
4. Click is tracked in database
5. User redirected to retailer
6. You earn commission on purchases

### Tracking

View affiliate statistics:
- Total clicks
- Clicks by platform
- Top books
- Estimated commissions

Access at: `/api/affiliates/stats` (admin only)

---

## Subscription Features Implementation

### Backend Middleware

**Check Premium Access:**
```javascript
const { requirePremium } = require('./middleware/subscription');

router.get('/premium-feature', authMiddleware, requirePremium, (req, res) => {
  // Only premium/pro users can access
});
```

**Check Specific Feature:**
```javascript
const { checkFeatureAccess } = require('./middleware/subscription');

router.get('/video-chat', 
  authMiddleware, 
  checkFeatureAccess('videoChat'), 
  (req, res) => {
    // Only users with videoChat feature can access
  }
);
```

**Check Resource Limits:**
```javascript
const { checkResourceLimit } = require('./middleware/subscription');

router.post('/reading-lists', 
  authMiddleware, 
  checkResourceLimit('maxReadingLists'), 
  (req, res) => {
    // Check if user can create more lists
  }
);
```

### Frontend Feature Gates

```javascript
import { useSubscription } from './hooks/useSubscription';

function FeatureComponent() {
  const { subscription, hasFeature, isLoading } = useSubscription();
  
  if (isLoading) return <Loading />;
  
  if (!hasFeature('videoChat')) {
    return (
      <UpgradePrompt 
        feature="Video Chat"
        requiredTier="premium"
      />
    );
  }
  
  return <VideoChat />;
}
```

---

## User Flow

### Subscription Flow

1. **Browse Pricing** → `/pricing`
2. **Select Plan** → Click upgrade button
3. **Checkout** → `/checkout` (login required)
4. **Enter Payment** → Stripe card element
5. **Start Trial** → 7 days free
6. **Confirmation** → Redirect to dashboard

### Cancellation Flow

1. **Billing Page** → `/billing`
2. **Cancel Subscription** → Confirms cancellation
3. **Active Until** → End of billing period
4. **Reactivate** → Option before period ends
5. **Downgrade** → To free tier after period

### Upgrade/Downgrade Flow

1. **Billing Page** → View current plan
2. **Change Plan** → Select new tier
3. **Prorated** → Calculate difference
4. **Immediate** → Changes apply now
5. **Adjusted Bill** → Next invoice shows proration

---

## Billing Portal

Stripe Customer Portal allows users to:
- Update payment methods
- View invoices
- Download receipts
- Update billing address
- Cancel subscription

Access: Click "Manage Billing" in `/billing` page

---

## Revenue Estimates

### Subscription Revenue
**Scenario:** 1,000 active users

| Tier | Users | Price | Monthly Revenue |
|------|-------|-------|-----------------|
| Free | 700 | $0 | $0 |
| Premium | 250 | $9.99 | $2,497.50 |
| Pro | 50 | $19.99 | $999.50 |
| **Total** | **1,000** | | **$3,497/month** |

### Affiliate Revenue
**Scenario:** 5,000 book purchases/month

| Platform | Clicks | Conversions | Avg Order | Commission | Revenue |
|----------|--------|-------------|-----------|------------|---------|
| Amazon | 3,000 | 300 (10%) | $15 | 4% | $180 |
| Bookshop | 1,500 | 150 (10%) | $15 | 10% | $225 |
| B&N | 500 | 50 (10%) | $15 | 5% | $37.50 |
| **Total** | **5,000** | **500** | | | **$442.50/month** |

**Combined Monthly Revenue:** ~$3,940

---

## Stripe Fees

- **Subscription:** 2.9% + $0.30 per transaction
- **Monthly Cost (1,000 users):** ~$140
- **Net Revenue:** ~$3,357/month

---

## Security

### Payment Security
- PCI compliance handled by Stripe
- No card data stored in database
- Tokenized payment methods
- 3D Secure authentication support

### Webhook Security
- Signature verification required
- Replay attack prevention
- IP whitelisting (optional)

### API Key Security
- Never commit to git
- Use environment variables
- Rotate keys regularly
- Different keys for test/production

---

## Testing Checklist

### Subscription Testing
- [ ] Create new subscription
- [ ] 7-day trial starts correctly
- [ ] Payment succeeds after trial
- [ ] Cancel subscription
- [ ] Reactivate subscription
- [ ] Upgrade tier (proration works)
- [ ] Downgrade tier
- [ ] Failed payment handling
- [ ] Webhook events process correctly

### Affiliate Testing
- [ ] Generate Amazon link
- [ ] Generate Bookshop link
- [ ] Generate B&N link
- [ ] Click tracking works
- [ ] Links open in new tab
- [ ] ISBN validation
- [ ] Stats display correctly

### Feature Gates Testing
- [ ] Free tier has correct limits
- [ ] Premium features locked for free users
- [ ] Pro features locked for premium users
- [ ] Upgrade prompts show correctly
- [ ] Features unlock after subscription
- [ ] Features lock after cancellation

---

## Troubleshooting

### "Payment Failed"
1. Check test card numbers
2. Verify Stripe keys are correct
3. Check card has sufficient funds (in test mode)
4. Review Stripe dashboard for decline reason

### "Webhook Not Receiving Events"
1. Verify webhook URL is accessible
2. Check webhook secret is correct
3. Test with Stripe CLI
4. Review webhook logs in Stripe dashboard

### "Affiliate Links Not Working"
1. Verify ISBN exists for book
2. Check affiliate tags are configured
3. Test links manually
4. Review browser console for errors

### "Features Not Unlocking"
1. Check subscription status in database
2. Verify middleware is applied correctly
3. Review subscription tier settings
4. Clear user session and re-login

---

## Going Live

### Pre-Production Checklist
- [ ] Switch to production Stripe keys
- [ ] Configure production webhook endpoint
- [ ] Set up proper SSL certificate
- [ ] Test with real payment methods
- [ ] Set up monitoring and alerts
- [ ] Configure backup payment gateway (optional)
- [ ] Create terms of service
- [ ] Create refund policy
- [ ] Set up customer support system

### Production Environment Variables
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Monitoring
- Track MRR (Monthly Recurring Revenue)
- Monitor churn rate
- Track conversion funnel
- Review failed payments
- Analyze affiliate performance

---

## Support

For issues with:
- **Stripe Integration:** [stripe.com/support](https://stripe.com/support)
- **Affiliate Programs:** Contact individual platforms
- **Technical Issues:** Check logs and documentation

---

**Last Updated:** December 2025
**Version:** 1.0
