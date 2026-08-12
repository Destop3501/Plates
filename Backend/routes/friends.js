const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getFriendList, sendFriendRequest, acceptFriendRequest } = require('../services/friends');
const supabase = require('../supabase');

/**
 * GET /api/friends
 * Get list of accepted friends for logged-in user.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const friends = await getFriendList(req.user.id);
    res.json({ friends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/friends/requests
 * Get pending friend requests (received or sent).
 */
router.get('/requests', authenticate, async (req, res) => {
  try {
    const type = req.query.type || 'received';
    const column = type === 'sent' ? 'user_id_1' : 'user_id_2';

    const { data: requests, error } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        user1:user_id_1 (id, full_name, email, avatar_url),
        user2:user_id_2 (id, full_name, email, avatar_url)
      `)
      .eq(column, req.user.id)
      .eq('status', 'pending');

    if (error) throw error;
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/friends/request
 * Send a friend request to a target user (by targetUserId or target email).
 */
router.post('/request', authenticate, async (req, res) => {
  try {
    let { targetUserId, email } = req.body;

    if (!targetUserId && email) {
      // Find user by email
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (error || !profile) {
        return res.status(440).json({ error: 'User with provided email not found.' });
      }
      targetUserId = profile.id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Please provide targetUserId or email.' });
    }

    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot send a friend request to yourself.' });
    }

    const friendship = await sendFriendRequest(req.user.id, targetUserId);
    res.status(201).json({ message: 'Friend request sent', friendship });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/friends/respond
 * Accept or reject a friend request.
 */
router.post('/respond', authenticate, async (req, res) => {
  try {
    const { friendshipId, action } = req.body; // action: 'accept' | 'reject'

    if (!friendshipId || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid payload. Action must be "accept" or "reject".' });
    }

    if (action === 'accept') {
      const updated = await acceptFriendRequest(friendshipId);
      return res.json({ message: 'Friend request accepted', friendship: updated });
    } else {
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', friendshipId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ message: 'Friend request rejected', friendship: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
