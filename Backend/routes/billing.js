const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getUserBalances,
  createDebt,
  getFriendBills,
  getDebtDetails,
  getDebtsForUser,
  settleDebt
} = require('../services/billing');

/**
 * GET /api/billing/summary
 * Returns active user financial summary (Total Owed, Total Owed to User, Net Balance).
 */
router.get('/summary', authenticate, async (req, res) => {
  try {
    const summary = await getUserBalances(req.user.id);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/billing/debts
 * List all debt records for the logged-in user with optional ?status=pending|settled filter.
 */
router.get('/debts', authenticate, async (req, res) => {
  try {
    const statusFilter = req.query.status || null;
    const debts = await getDebtsForUser(req.user.id, statusFilter);
    res.json({ debts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/billing/friend/:friendId
 * UI Action: Click on a Friend -> Get ALL shared bills with that friend.
 */
router.get('/friend/:friendId', authenticate, async (req, res) => {
  try {
    const { friendId } = req.params;
    const bills = await getFriendBills(req.user.id, friendId);
    res.json({ friendId, count: bills.length, bills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/billing/debts/:debtId
 * UI Action: Click on a Bill -> Get complete details of that single bill.
 */
router.get('/debts/:debtId', authenticate, async (req, res) => {
  try {
    const { debtId } = req.params;
    const debtDetails = await getDebtDetails(debtId);
    if (!debtDetails) {
      return res.status(404).json({ error: 'Bill record not found' });
    }
    res.json({ bill: debtDetails });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/billing/debt
 * Create a new split-bill / debt record with category tag and optional items/restaurant.
 */
router.post('/debt', authenticate, async (req, res) => {
  try {
    const { payeeId, amount, description, category, restaurantId, items } = req.body;

    if (!payeeId || !amount || !description) {
      return res.status(400).json({ error: 'Please provide payeeId, amount, and description.' });
    }

    const debt = await createDebt({
      payerId: req.user.id, // Current authenticated user is the payer by default
      payeeId,
      amount: parseFloat(amount),
      description,
      category: category || 'other',
      restaurantId: restaurantId || null,
      items: items || []
    });

    res.status(201).json({ message: 'Debt transaction created successfully', debt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/billing/settle
 * Settle a pending debt.
 */
router.post('/settle', authenticate, async (req, res) => {
  try {
    const { debtId } = req.body;
    if (!debtId) {
      return res.status(400).json({ error: 'Missing required field: debtId' });
    }

    const settled = await settleDebt(debtId);
    res.json({ message: 'Bill settled successfully', debt: settled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
