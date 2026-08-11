const http = require('http');

// Use this if you are on an older Node version (uncomment):
// require('dotenv').config();

const port = 3000;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const htmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Supabase Auth Callback Test</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        body { font-family: sans-serif; padding: 2rem; }
        .success { color: green; }
        .error { color: red; }
        pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Auth Callback Result</h1>
    <h2 id="status">Checking authentication status...</h2>
    <pre id="data">No data yet.</pre>

    <script>
        // Initialize Supabase client on the frontend
        const supabaseUrl = '${supabaseUrl}';
        const supabaseKey = '${supabaseKey}';
        const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

        async function checkSession() {
            // Supabase automatically parses the URL hash fragment (#access_token=...) 
            // when the client initializes, storing the session in local storage.
            const { data: { session }, error } = await supabase.auth.getSession();

            const statusEl = document.getElementById('status');
            const dataEl = document.getElementById('data');

            if (error) {
                statusEl.className = 'error';
                statusEl.innerText = 'Authentication Error';
                dataEl.innerText = JSON.stringify(error, null, 2);
                return;
            }

            if (session) {
                statusEl.className = 'success';
                statusEl.innerText = 'Successfully Authenticated!';
                dataEl.innerText = JSON.stringify({
                    user: session.user.email,
                    fullName: session.user.user_metadata.full_name,
                    token: session.access_token.substring(0, 20) + '...',
                    expiresAt: new Date(session.expires_at * 1000).toLocaleString()
                }, null, 2);
            } else {
                statusEl.className = 'error';
                statusEl.innerText = 'No session found in URL.';
                dataEl.innerText = 'Make sure you were redirected here from the Google login flow.';
            }
        }

        checkSession();

        // Listen for auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event);
            if (event === 'SIGNED_IN') {
                checkSession();
            }
        });
    </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    // Only serve the callback page if the URL starts with /auth/callback
    if (req.url.startsWith('/auth/callback')) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlPage);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found. You should be accessing /auth/callback');
    }
});

server.listen(port, () => {
    console.log(`\nLocal test server running at http://localhost:${port}`);
    console.log('Waiting for auth callback...');
});
