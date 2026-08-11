/**
 * Friends Module
 */
const supabase = require('../supabase');

/**
 * Fetches the friend list for a given user ID with status 'accepted'.
 * Handles relationships where the user could be user_id_1 or user_id_2.
 * @param {string} userId - UUID of the user.
 * @returns {Promise<Array<{id: string, email: string, full_name: string, avatar_url: string}>>}
 */
async function getFriendList(userId) {
  try {
    // Query friendships where user is user_id_1 or user_id_2 and status is 'accepted'
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id_1,
        user_id_2,
        status,
        user1:user_id_1 (id, email, full_name, avatar_url),
        user2:user_id_2 (id, email, full_name, avatar_url)
      `)
      .eq('status', 'accepted')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    if (error) throw error;

    // Format output to return the opposite user's profile details
    const friends = friendships.map(f => {
      return f.user_id_1 === userId ? f.user2 : f.user1;
    });

    return friends;
  } catch (error) {
    console.error('Error fetching friend list:', error.message);
    throw error;
  }
}

/**
 * Sends a friend request to another user.
 * @param {string} currentUserId - UUID of requesting user.
 * @param {string} friendUserId - UUID of recipient user.
 */
async function sendFriendRequest(currentUserId, friendUserId) {
  const { data, error } = await supabase
    .from('friendships')
    .insert([
      {
        user_id_1: currentUserId,
        user_id_2: friendUserId,
        status: 'pending'
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Accepts a pending friend request.
 * @param {string} friendshipId - UUID of the friendship record.
 */
async function acceptFriendRequest(friendshipId) {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', friendshipId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  getFriendList,
  sendFriendRequest,
  acceptFriendRequest
};
