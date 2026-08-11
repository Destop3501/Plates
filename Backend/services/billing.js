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
    // 1. Fetch pending debts where user is the payer (user owes money)
    const { data: debtsIOwe, error: oweErr } = await supabase
      .from('debts')
      .select('amount')
      .eq('payer_id', userId)
      .eq('status', 'pending');

    if (oweErr) throw oweErr;

    // 2. Fetch pending debts where user is the payee (user is owed money)
    const { data: debtsOwedToMe, error: owedMeErr } = await supabase
      .from('debts')
      .select('amount')
      .eq('payee_id', userId)
      .eq('status', 'pending');

    if (owedMeErr) throw owedMeErr;

    // Calculate totals
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
 * Creates a new debt/transaction.
 * @param {Object} debtPayload
 * @param {string} debtPayload.payerId - Person who owes money
 * @param {string} debtPayload.payeeId - Person who is owed money
 * @param {number} debtPayload.amount - Amount
 * @param {string} debtPayload.description - Description (e.g. "Pizza at Italian bistro")
 */
async function createDebt({ payerId, payeeId, amount, description }) {
  const { data, error } = await supabase
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

  if (error) throw error;
  return data;
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
  settleDebt
};
