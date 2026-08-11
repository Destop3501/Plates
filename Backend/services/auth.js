/**
 * Authentication Module (Google OAuth)
 */
const supabase = require('../supabase');

/**
 * Initiates Google OAuth Sign-In / Sign-Up flow.
 * @param {string} redirectTo - Callback URL after successful Google authentication.
 * @returns {Promise<{url: string|null, error: Error|null}>}
 */
async function signInWithGoogle(redirectTo = 'http://localhost:3000/auth/callback') {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline'
        },
        scopes: 'email profile'
      }
    });

    if (error) throw error;
    return { url: data.url, error: null };
  } catch (error) {
    console.error('Error initiating Google Sign-In:', error.message);
    return { url: null, error };
  }
}

/**
 * Gets the current authenticated session.
 */
async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Signs out the current user.
 */
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

module.exports = {
  signInWithGoogle,
  getCurrentSession,
  signOut
};
