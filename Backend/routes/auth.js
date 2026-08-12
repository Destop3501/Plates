const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const supabase = require('../supabase');

/**
 * GET /api/auth/me
 * Returns profile details for the authenticated user.
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ user: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/logout
 * Revokes current authenticated session.
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.json({ message: 'Successfully logged out' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
