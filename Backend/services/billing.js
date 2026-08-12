/**
 * Billing & Debts Module
 */
const supabase = require('../supabase');

/**
 * Calculates a user's total active balances (total money owed and total money they are owed).
 * @param {string} userId - UUID of the user.
 * @returns {Promise<{totalOwed: number, totalOwedToUser: number, netBalance: number}>}
 */
async function getUserBalances(userId) {
  try {
    const { data: debtsIOwe, error: oweErr } = await supabase
      .from('debts')
      .select('amount')
      .eq('payer_id', userId)
      .eq('status', 'pending');

    if (oweErr) throw oweErr;

    const { data: debtsOwedToMe, error: owedMeErr } = await supabase
      .from('debts')
      .select('amount')
      .eq('payee_id', userId)
      .eq('status', 'pending');

    if (owedMeErr) throw owedMeErr;

    const totalOwed = debtsIOwe.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const totalOwedToUser = debtsOwedToMe.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const netBalance = totalOwedToUser - totalOwed;

    return {
      totalOwed: Number(totalOwed.toFixed(2)),
      totalOwedToUser: Number(totalOwedToUser.toFixed(2)),
      netBalance: Number(netBalance.toFixed(2))
    };
  } catch (error) {
    console.error('Error calculating user balances:', error.message);
    throw error;
  }
}

/**
 * Creates a new debt/transaction with category tag and optional items/restaurant.
 * @param {Object} debtPayload
 */
async function createDebt({ payerId, payeeId, amount, description, category = 'other', restaurantId = null, items = [] }) {
  try {
    const { data, error } = await supabase
      .from('debts')
      .insert([
        {
          payer_id: payerId,
          payee_id: payeeId,
          amount,
          description,
          category,
          restaurant_id: restaurantId,
          items,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error && error.message.includes('category')) {
      // Fallback if category/restaurant_id columns are not yet in live DB
      const fallback = await supabase
        .from('debts')
        .insert([
          {
            payer_id: payerId,
            payee_id: payeeId,
            amount,
            description,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (fallback.error) throw fallback.error;
      return fallback.data;
    } else if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating debt:', error.message);
    throw error;
  }
}

/**
 * Fetches all shared bills between a user and a specific friend.
 * @param {string} userId - UUID of logged-in user
 * @param {string} friendId - UUID of the target friend
 */
async function getFriendBills(userId, friendId) {
  try {
    let { data, error } = await supabase
      .from('debts')
      .select(`
        id,
        amount,
        description,
        category,
        status,
        created_at,
        payer:payer_id (id, full_name, email, avatar_url),
        payee:payee_id (id, full_name, email, avatar_url),
        restaurant:restaurant_id (id, name, location)
      `)
      .or(`and(payer_id.eq.${userId},payee_id.eq.${friendId}),and(payer_id.eq.${friendId},payee_id.eq.${userId})`)
      .order('created_at', { ascending: false });

    // Fallback if restaurant_id FK is not yet applied in live DB schema
    if (error && error.message.includes('restaurant_id')) {
      const fallback = await supabase
        .from('debts')
        .select(`
          id,
          amount,
          description,
          status,
          created_at,
          payer:payer_id (id, full_name, email, avatar_url),
          payee:payee_id (id, full_name, email, avatar_url)
        `)
        .or(`and(payer_id.eq.${userId},payee_id.eq.${friendId}),and(payer_id.eq.${friendId},payee_id.eq.${userId})`)
        .order('created_at', { ascending: false });

      if (fallback.error) throw fallback.error;
      data = fallback.data;
    } else if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching friend bills:', error.message);
    throw error;
  }
}

/**
 * Fetches complete details for a single bill/debt.
 * @param {string} debtId - UUID of the debt record
 */
async function getDebtDetails(debtId) {
  try {
    let { data, error } = await supabase
      .from('debts')
      .select(`
        id,
        amount,
        description,
        category,
        items,
        status,
        created_at,
        updated_at,
        payer:payer_id (id, full_name, email, avatar_url),
        payee:payee_id (id, full_name, email, avatar_url),
        restaurant:restaurant_id (id, name, location, image_url)
      `)
      .eq('id', debtId)
      .maybeSingle();

    // Fallback if restaurant_id FK is not yet applied in live DB schema
    if (error && error.message.includes('restaurant_id')) {
      const fallback = await supabase
        .from('debts')
        .select(`
          id,
          amount,
          description,
          status,
          created_at,
          updated_at,
          payer:payer_id (id, full_name, email, avatar_url),
          payee:payee_id (id, full_name, email, avatar_url)
        `)
        .eq('id', debtId)
        .maybeSingle();

      if (fallback.error) throw fallback.error;
      data = fallback.data;
    } else if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching debt details:', error.message);
    throw error;
  }
}

/**
 * Fetches all debts involving a user with optional status filter.
 */
async function getDebtsForUser(userId, statusFilter = null) {
  try {
    let query = supabase
      .from('debts')
      .select(`
        id,
        amount,
        description,
        category,
        status,
        created_at,
        payer:payer_id (id, full_name, email, avatar_url),
        payee:payee_id (id, full_name, email, avatar_url)
      `)
      .or(`payer_id.eq.${userId},payee_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching debts for user:', error.message);
    throw error;
  }
}

/**
 * Marks a debt as settled.
 * @param {string} debtId - UUID of debt record
 */
async function settleDebt(debtId) {
  const { data, error } = await supabase
    .from('debts')
    .update({ status: 'settled', updated_at: new Date().toISOString() })
    .eq('id', debtId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  getUserBalances,
  createDebt,
  getFriendBills,
  getDebtDetails,
  getDebtsForUser,
  settleDebt
};
