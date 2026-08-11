// Load environment variables (uncomment if using dotenv)
// require('dotenv').config();

const supabase = require('./supabase');

/**
 * Generates the Google OAuth sign-in URL.
 * In a real application, you would redirect your user to this URL.
 */
async function generateGoogleLoginUrl() {
  console.log('Generating Google Auth URL...');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // The URL you want Supabase to redirect back to after a successful login.
      // This needs to be added to your Supabase Dashboard "Redirect URLs" list.
      redirectTo: 'http://localhost:3000/auth/callback',
      // Optional: Request additional Google scopes if needed
      // scopes: 'https://www.googleapis.com/auth/calendar.readonly'
    },
  });

  if (error) {
    console.error('❌ Error generating Google Login URL:', error.message);
    return null;
  }

  console.log('✅ Success! Redirect your user to this URL:');
  console.log(data.url);
  return data.url;
}

// Call the function to demonstrate
generateGoogleLoginUrl();
