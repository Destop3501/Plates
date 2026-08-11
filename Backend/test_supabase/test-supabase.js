// Load environment variables (uncomment if you installed dotenv)
// require('dotenv').config();

const supabase = require('../supabase');

async function testConnection() {
  console.log('Testing Supabase configuration...');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('❌ Missing credentials! Please update your .env file with your actual Supabase URL and Key.');
    return;
  }

  try {
    // Making a lightweight request to test if the client can reach your Supabase project
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Connection failed or returned an error:', error.message);
    } else {
      console.log('✅ Successfully connected to your Supabase project!');
    }
  } catch (err) {
    console.error('❌ Network or unexpected error:', err.message);
  }
}

testConnection();
