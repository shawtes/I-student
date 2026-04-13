const Usage = require('../models/Usage');
const Subscription = require('../models/Subscription');

const DAILY_LIMITS = {
  free: 5,
  pro: 100,
  premium: Infinity,
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Checks daily AI quota based on subscription plan. Must run after auth.
async function aiQuota(req, res, next) {
  try {
    const userId = req.user?.cognitoId;
    if (!userId) return res.status(401).json({ message: 'No auth' });

    let sub = await Subscription.findOne({ userId });
    if (!sub) sub = { plan: 'free', status: 'active' };

    const plan = sub.status === 'active' ? (sub.plan || 'free') : 'free';
    const limit = DAILY_LIMITS[plan] ?? DAILY_LIMITS.free;

    // Premium = no limit, skip tracking
    if (limit === Infinity) return next();

    const date = todayKey();
    const usage = await Usage.findOneAndUpdate(
      { userId, date },
      { $setOnInsert: { count: 0 } },
      { upsert: true, new: true }
    );

    if (usage.count >= limit) {
      return res.status(402).json({
        message: `Daily AI limit reached (${limit} requests). Upgrade your plan for more.`,
        plan,
        limit,
        used: usage.count,
        quotaExceeded: true
      });
    }

    // Increment. Attach info so the service can include it in responses if desired.
    usage.count += 1;
    await usage.save();
    req.aiQuota = { plan, limit, used: usage.count, remaining: limit - usage.count };
    next();
  } catch (err) {
    console.error('aiQuota middleware error:', err);
    // Fail open for demo so quota issues don't block everything
    next();
  }
}

// Read-only usage report
async function getUsage(userId) {
  const date = todayKey();
  const usage = await Usage.findOne({ userId, date });
  let sub = await Subscription.findOne({ userId });
  const plan = sub?.status === 'active' ? (sub.plan || 'free') : 'free';
  const limit = DAILY_LIMITS[plan];
  return {
    plan,
    used: usage?.count || 0,
    limit: limit === Infinity ? null : limit,
    remaining: limit === Infinity ? null : limit - (usage?.count || 0),
  };
}

module.exports = { aiQuota, getUsage, DAILY_LIMITS };
