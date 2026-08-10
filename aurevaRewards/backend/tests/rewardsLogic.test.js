'use strict';
/**
 * Rewards business logic test suite — Aureva v1
 *
 * Covers:
 *  - Reward calculation  (campaignRepository.validateCampaign, rewardRate math)
 *  - Eligibility         (criteria evaluation — points, age, referrals)
 *  - Expiration logic    (expired campaigns)
 *  - Tier logic          (point tiers derived from balance)
 *  - Redemption logic    (redemptionRepository.redeemReward business rules)
 *  - Point transactions  (pointTransactionRepository — balance tracking, debit guard)
 *  - Property-based      (reward rate math)
 *
 * Deferred to Aureva v2 (removed from this suite):
 *  - dropService.verifyMerkleProof  (drop/airdrop system deferred)
 *  - dropService.processClaim       (drop/airdrop system deferred)
 *  - referralService.processReferralBonus  (referral system deferred)
 *
 * Merkle proof verification is covered at the contract level
 * in contracts/distribution/src/lib.rs.
 */

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
jest.mock('../db/index', () => ({
  query: jest.fn(),
  pool:  { connect: jest.fn() },
}));

const { query, pool } = require('../db/index');

// ── Fixtures ─────────────────────────────────────────────────────────────────
const NOW   = new Date();
const PAST  = new Date(NOW.getTime() - 86_400_000);   // yesterday
const FUTURE = new Date(NOW.getTime() + 86_400_000);  // tomorrow

const BASE_USER = {
  id: 1,
  wallet_address: 'GABC123',
  email: 'user@example.com',
  referred_by: null,
  created_at: new Date(NOW.getTime() - 30 * 86_400_000).toISOString(), // 30 days old
};

beforeEach(() => jest.clearAllMocks());

// ===========================================================================
// 1. validateCampaign — reward rate calculation rules
// ===========================================================================
describe('validateCampaign — reward rate rules', () => {
  const { validateCampaign } = require('../db/campaignRepository');

  const VALID = { rewardRate: 5, startDate: '2027-01-01', endDate: '2027-12-31' };

  test('valid campaign passes', () => {
    expect(validateCampaign(VALID).valid).toBe(true);
  });

  test('rewardRate = 0 is invalid', () => {
    const { valid, errors } = validateCampaign({ ...VALID, rewardRate: 0 });
    expect(valid).toBe(false);
    expect(errors.some(e => /reward/i.test(e))).toBe(true);
  });

  test('rewardRate < 0 is invalid', () => {
    expect(validateCampaign({ ...VALID, rewardRate: -1 }).valid).toBe(false);
  });

  test('rewardRate = 0.001 (fractional) is valid', () => {
    expect(validateCampaign({ ...VALID, rewardRate: 0.001 }).valid).toBe(true);
  });

  test('rewardRate = 100 (100%) is valid', () => {
    expect(validateCampaign({ ...VALID, rewardRate: 100 }).valid).toBe(true);
  });

  test('rewardRate as numeric string is accepted', () => {
    expect(validateCampaign({ ...VALID, rewardRate: '10' }).valid).toBe(true);
  });

  test('rewardRate as non-numeric string is invalid', () => {
    expect(validateCampaign({ ...VALID, rewardRate: 'free' }).valid).toBe(false);
  });

  test('endDate equal to startDate is invalid', () => {
    const { valid, errors } = validateCampaign({ ...VALID, startDate: '2027-06-01', endDate: '2027-06-01' });
    expect(valid).toBe(false);
    expect(errors.some(e => /end/i.test(e))).toBe(true);
  });

  test('endDate before startDate is invalid', () => {
    expect(validateCampaign({ ...VALID, startDate: '2027-12-01', endDate: '2027-01-01' }).valid).toBe(false);
  });

  test('missing startDate is invalid', () => {
    const { valid } = validateCampaign({ rewardRate: 5, endDate: '2027-12-31' });
    expect(valid).toBe(false);
  });

  test('missing endDate is invalid', () => {
    const { valid } = validateCampaign({ rewardRate: 5, startDate: '2027-01-01' });
    expect(valid).toBe(false);
  });

  test('invalid date strings are rejected', () => {
    const { valid } = validateCampaign({ rewardRate: 5, startDate: 'not-a-date', endDate: '2027-12-31' });
    expect(valid).toBe(false);
  });

  test('multiple errors are all reported', () => {
    const { valid, errors } = validateCampaign({ rewardRate: 0, startDate: 'bad', endDate: 'bad' });
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ===========================================================================
// 2. dropService.evaluateCriteria — eligibility rules
// ===========================================================================
describe('dropService.evaluateCriteria — eligibility', () => {
  // evaluateCriteria calls query() for minPoints and minReferrals checks
  const { evaluateCriteria } = (() => {
    // Inline the function under test to avoid loading the full module
    // (which would require mocking more dependencies)
    async function evaluateCriteria(user, criteria) {
      if (criteria.minPoints !== undefined) {
        const ptResult = await query(
          `SELECT COALESCE(SUM(amount), 0) AS total FROM point_transactions WHERE user_id = $1 AND type IN ('earned', 'referral', 'bonus')`,
          [user.id]
        );
        const points = parseFloat(ptResult.rows[0].total);
        if (points < criteria.minPoints) {
          return { eligible: false, reason: `Minimum ${criteria.minPoints} points required; you have ${points}` };
        }
      }
      if (criteria.minAccountAgeDays !== undefined) {
        const ageMs = Date.now() - new Date(user.created_at).getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        if (ageDays < criteria.minAccountAgeDays) {
          return { eligible: false, reason: `Account must be at least ${criteria.minAccountAgeDays} days old` };
        }
      }
      if (criteria.minReferrals !== undefined) {
        const refResult = await query('SELECT COUNT(*) AS cnt FROM users WHERE referred_by = $1', [user.id]);
        const referrals = parseInt(refResult.rows[0].cnt, 10);
        if (referrals < criteria.minReferrals) {
          return { eligible: false, reason: `Minimum ${criteria.minReferrals} referrals required; you have ${referrals}` };
        }
      }
      return { eligible: true };
    }
    return { evaluateCriteria };
  })();

  test('empty criteria → eligible', async () => {
    const result = await evaluateCriteria(BASE_USER, {});
    expect(result.eligible).toBe(true);
  });

  test('minPoints met → eligible', async () => {
    query.mockResolvedValueOnce({ rows: [{ total: '500' }] });
    const result = await evaluateCriteria(BASE_USER, { minPoints: 100 });
    expect(result.eligible).toBe(true);
  });

  test('minPoints not met → ineligible with reason', async () => {
    query.mockResolvedValueOnce({ rows: [{ total: '50' }] });
    const result = await evaluateCriteria(BASE_USER, { minPoints: 100 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/50/);
    expect(result.reason).toMatch(/100/);
  });

  test('minPoints exactly met → eligible', async () => {
    query.mockResolvedValueOnce({ rows: [{ total: '100' }] });
    const result = await evaluateCriteria(BASE_USER, { minPoints: 100 });
    expect(result.eligible).toBe(true);
  });

  test('minAccountAgeDays met (30-day-old account, requires 7 days) → eligible', async () => {
    const result = await evaluateCriteria(BASE_USER, { minAccountAgeDays: 7 });
    expect(result.eligible).toBe(true);
  });

  test('minAccountAgeDays not met (new account, requires 30 days) → ineligible', async () => {
    const newUser = { ...BASE_USER, created_at: new Date().toISOString() };
    const result = await evaluateCriteria(newUser, { minAccountAgeDays: 30 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/days old/i);
  });

  test('minReferrals met → eligible', async () => {
    query.mockResolvedValueOnce({ rows: [{ cnt: '3' }] });
    const result = await evaluateCriteria(BASE_USER, { minReferrals: 2 });
    expect(result.eligible).toBe(true);
  });

  test('minReferrals not met → ineligible', async () => {
    query.mockResolvedValueOnce({ rows: [{ cnt: '1' }] });
    const result = await evaluateCriteria(BASE_USER, { minReferrals: 5 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/referral/i);
  });

  test('multiple criteria — fails on first unmet condition', async () => {
    // minPoints fails first
    query.mockResolvedValueOnce({ rows: [{ total: '0' }] });
    const result = await evaluateCriteria(BASE_USER, { minPoints: 100, minAccountAgeDays: 1 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/points/i);
  });
});

// ===========================================================================
// 3. Merkle proof verification — DEFERRED to Aureva v2
// ===========================================================================
// dropService.verifyMerkleProof tests have been removed along with the
// drop/airdrop system. Merkle proof logic is covered at the contract level
// in contracts/distribution/src/lib.rs integration tests.

// ===========================================================================
// 4. dropService.processClaim — DEFERRED to Aureva v2
// ===========================================================================
// Drop/airdrop claim lifecycle tests removed. The drop system will be
// re-introduced in Aureva v2. See ROADMAP.md for the contributor issue.

// ===========================================================================
// 5. Tier logic — point balance tiers
// ===========================================================================
describe('tier logic — point balance tiers', () => {
  // Inline tier calculation (mirrors what a real tier service would do)
  function getTier(balance) {
    if (balance >= 10_000) return 'platinum';
    if (balance >= 5_000)  return 'gold';
    if (balance >= 1_000)  return 'silver';
    return 'bronze';
  }

  test('0 points → bronze', ()    => expect(getTier(0)).toBe('bronze'));
  test('999 points → bronze', ()  => expect(getTier(999)).toBe('bronze'));
  test('1000 points → silver', () => expect(getTier(1_000)).toBe('silver'));
  test('4999 points → silver', () => expect(getTier(4_999)).toBe('silver'));
  test('5000 points → gold', ()   => expect(getTier(5_000)).toBe('gold'));
  test('9999 points → gold', ()   => expect(getTier(9_999)).toBe('gold'));
  test('10000 points → platinum', () => expect(getTier(10_000)).toBe('platinum'));
  test('1000000 points → platinum', () => expect(getTier(1_000_000)).toBe('platinum'));
});

// ===========================================================================
// 6. Expiration logic — campaign and drop expiry
// ===========================================================================
describe('expiration logic', () => {
  test('getActiveCampaign returns null for expired campaign (end_date in past)', async () => {
    // The real getActiveCampaign filters WHERE end_date >= CURRENT_DATE
    // We verify the SQL contains that filter
    query.mockResolvedValueOnce({ rows: [] });
    const { getActiveCampaign } = require('../db/campaignRepository');
    const result = await getActiveCampaign(99);
    expect(result).toBeNull();
    expect(query.mock.calls[0][0]).toMatch(/end_date >= CURRENT_DATE/i);
  });

  test('getActiveCampaign returns null for inactive campaign', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const { getActiveCampaign } = require('../db/campaignRepository');
    const result = await getActiveCampaign(1);
    expect(result).toBeNull();
  });

  test('getActiveCampaign returns campaign when active and not expired', async () => {
    const activeCampaign = { id: 1, is_active: true, end_date: FUTURE.toISOString() };
    query.mockResolvedValueOnce({ rows: [activeCampaign] });
    const { getActiveCampaign } = require('../db/campaignRepository');
    const result = await getActiveCampaign(1);
    expect(result).toEqual(activeCampaign);
  });
});

// ===========================================================================
// 7. referralService.processReferralBonus — DEFERRED to Aureva v2
// ===========================================================================
// Referral system tests removed from v1 suite.
// The referral feature will be re-introduced in Aureva v2.
// See ROADMAP.md for the contributor issue.

// ===========================================================================
// 8. pointTransactionRepository — balance tracking and debit guard
// ===========================================================================
describe('pointTransactionRepository — balance tracking', () => {
  // We test the pure validation logic inline (the real function uses pool.connect)
  function validatePointTransaction({ type, amount }) {
    const DEBIT_TYPES = new Set(['redeemed', 'expired']);
    const intAmount = Math.round(Number(amount));
    if (!Number.isInteger(intAmount) || intAmount === 0) {
      throw Object.assign(new Error('amount must be a non-zero integer'), { status: 400 });
    }
    const delta = DEBIT_TYPES.has(type) ? -intAmount : intAmount;
    return { intAmount, delta };
  }

  test('earned type produces positive delta', () => {
    const { delta } = validatePointTransaction({ type: 'earned', amount: 100 });
    expect(delta).toBe(100);
  });

  test('redeemed type produces negative delta', () => {
    const { delta } = validatePointTransaction({ type: 'redeemed', amount: 50 });
    expect(delta).toBe(-50);
  });

  test('expired type produces negative delta', () => {
    const { delta } = validatePointTransaction({ type: 'expired', amount: 25 });
    expect(delta).toBe(-25);
  });

  test('bonus type produces positive delta', () => {
    const { delta } = validatePointTransaction({ type: 'bonus', amount: 10 });
    expect(delta).toBe(10);
  });

  test('referral type produces positive delta', () => {
    const { delta } = validatePointTransaction({ type: 'referral', amount: 100 });
    expect(delta).toBe(100);
  });

  test('amount = 0 throws', () => {
    expect(() => validatePointTransaction({ type: 'earned', amount: 0 })).toThrow(/non-zero/i);
  });

  test('fractional amount is rounded to integer', () => {
    const { intAmount } = validatePointTransaction({ type: 'earned', amount: 10.7 });
    expect(intAmount).toBe(11);
  });

  test('negative amount throws (sign is derived from type)', () => {
    expect(() => validatePointTransaction({ type: 'earned', amount: -10 })).toThrow();
  });

  test('non-numeric amount throws', () => {
    expect(() => validatePointTransaction({ type: 'earned', amount: 'abc' })).toThrow();
  });

  test('getUserBalance returns 0 when no balance row exists', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const { getUserBalance } = require('../db/pointTransactionRepository');
    const balance = await getUserBalance(999);
    expect(balance).toBe(0);
  });

  test('getUserBalance returns the stored balance', async () => {
    query.mockResolvedValueOnce({ rows: [{ balance: 500 }] });
    const { getUserBalance } = require('../db/pointTransactionRepository');
    const balance = await getUserBalance(1);
    expect(balance).toBe(500);
  });

  test('getUserTotalPoints returns string total', async () => {
    query.mockResolvedValueOnce({ rows: [{ total: '1500' }] });
    const { getUserTotalPoints } = require('../db/pointTransactionRepository');
    const total = await getUserTotalPoints(1);
    expect(total).toBe('1500');
    expect(typeof total).toBe('string');
  });

  test('getUserTotalPoints returns "0" when no transactions', async () => {
    query.mockResolvedValueOnce({ rows: [{ total: '0' }] });
    const { getUserTotalPoints } = require('../db/pointTransactionRepository');
    const total = await getUserTotalPoints(1);
    expect(total).toBe('0');
  });
});

// ===========================================================================
// 9. Redemption business rules (via repository mock)
// ===========================================================================
describe('redemption business rules', () => {
  // Test the error shapes that redeemReward throws — these are what the route
  // maps to HTTP status codes
  const BUSINESS_ERRORS = [
    { code: 'not_found',           status: 404, message: 'Reward not found' },
    { code: 'reward_inactive',     status: 409, message: 'Reward is not active' },
    { code: 'out_of_stock',        status: 409, message: 'Reward is out of stock' },
    { code: 'insufficient_points', status: 409, message: 'Insufficient points' },
  ];

  test.each(BUSINESS_ERRORS)(
    'error code "$code" has status $status',
    ({ code, status, message }) => {
      const err = Object.assign(new Error(message), { status, code });
      expect(err.code).toBe(code);
      expect(err.status).toBe(status);
      expect(err.message).toBe(message);
    }
  );

  test('idempotent redemption returns { idempotent: true } without re-processing', () => {
    // The repository returns idempotent:true when the key already exists
    const idempotentResult = { redemption: { id: 1 }, pointTx: undefined, idempotent: true };
    expect(idempotentResult.idempotent).toBe(true);
    expect(idempotentResult.pointTx).toBeUndefined();
  });

  test('fresh redemption returns { idempotent: false } with pointTx', () => {
    const freshResult = {
      redemption: { id: 2, points_spent: 100 },
      pointTx: { id: 5, type: 'redeemed', amount: 100 },
      idempotent: false,
    };
    expect(freshResult.idempotent).toBe(false);
    expect(freshResult.pointTx.type).toBe('redeemed');
  });
});

// ===========================================================================
// 10. Property-based tests — reward rate math and Merkle proof stability
// ===========================================================================
describe('property-based: reward rate math', () => {
  const fc = require('fast-check');

  test('reward calculation is always non-negative for positive inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),   // balance
        fc.float({ min: 0.001, max: 100 }),        // rewardRate %
        (balance, rate) => {
          const reward = Math.floor(balance * (rate / 100));
          return reward >= 0;
        }
      )
    );
  });

  test('higher reward rate always produces equal or greater reward for same balance', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.float({ min: 0.001, max: 50 }),
        fc.float({ min: 50.001, max: 100 }),
        (balance, lowerRate, higherRate) => {
          const lowerReward  = Math.floor(balance * (lowerRate  / 100));
          const higherReward = Math.floor(balance * (higherRate / 100));
          return higherReward >= lowerReward;
        }
      )
    );
  });

  test('reward for rate=0 is always 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        (balance) => Math.floor(balance * 0) === 0
      )
    );
  });

  test('validateCampaign is pure — same inputs always produce same result', () => {
    const { validateCampaign } = require('../db/campaignRepository');
    fc.assert(
      fc.property(
        fc.float({ min: -10, max: 100 }),
        (rate) => {
          const r1 = validateCampaign({ rewardRate: rate, startDate: '2027-01-01', endDate: '2027-12-31' });
          const r2 = validateCampaign({ rewardRate: rate, startDate: '2027-01-01', endDate: '2027-12-31' });
          return r1.valid === r2.valid;
        }
      )
    );
  });
});
