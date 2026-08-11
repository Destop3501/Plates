const http = require('http');

// Use this if you are on an older Node version (uncomment):
// require('dotenv').config();

const port = 3000;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// ---------------------------------------------------------
// 1. HOME PAGE (with the Login Button)
// ---------------------------------------------------------
const indexPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Auth Test</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f9fafb; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
        button { background-color: #4285F4; color: white; border: none; padding: 12px 24px; border-radius: 4px; font-size: 16px; cursor: pointer; display: flex; align-items: center; gap: 10px; margin: 20px auto; }
        button:hover { background-color: #3367D6; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Welcome to the App</h1>
        <p>Click the button below to sign in with your Google account.</p>
        
        <button id="loginBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path fill="none" d="M1 1h22v22H1z"/></svg>
            Sign in with Google
        </button>
    </div>

    <div id="debug" style="margin-top: 20px; padding: 1rem; background: #1e1e1e; color: #0f0; font-family: monospace; font-size: 12px; border-radius: 8px; max-width: 600px; text-align: left; display: none; max-height: 300px; overflow-y: auto;"></div>

    <script>
        const debugEl = document.getElementById('debug');
        function log(msg) {
            console.log(msg);
            debugEl.style.display = 'block';
            debugEl.innerHTML += new Date().toLocaleTimeString() + ' | ' + msg + '<br>';
            debugEl.scrollTop = debugEl.scrollHeight;
        }

        log('Initializing Supabase client...');
        log('URL: ${supabaseUrl}');
        log('Key: ${supabaseKey}'.substring(0, 20) + '...');

        const sb = window.supabase.createClient('${supabaseUrl}', '${supabaseKey}');
        log('✅ Supabase client created');

        document.getElementById('loginBtn').addEventListener('click', async () => {
            log('🔵 Button clicked! Starting OAuth...');

            try {
                const { data, error } = await sb.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: 'http://localhost:3000/auth/callback',
                        skipBrowserRedirect: true,
                        queryParams: {
                            prompt: 'select_account',
                            access_type: 'offline'
                        },
                        scopes: 'email profile'
                    }
                });

                log('Response received from signInWithOAuth');

                if (error) {
                    log('❌ ERROR: ' + JSON.stringify(error));
                    alert('Error: ' + error.message);
                    return;
                }

                if (data && data.url) {
                    log('✅ Got OAuth URL: ' + data.url);
                    log('Redirecting browser now...');
                    window.location.href = data.url;
                } else {
                    log('⚠️ No URL in response. Full data: ' + JSON.stringify(data));
                }
            } catch (err) {
                log('❌ CATCH ERROR: ' + err.message);
                log('Stack: ' + err.stack);
            }
        });

        log('Ready. Click the button to sign in.');
    </script>
</body>
</html>
`;

// ---------------------------------------------------------
// 2. CALLBACK PAGE (Handles the redirect after login)
// ---------------------------------------------------------
const callbackPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auth Callback Test</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        body { font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto;}
        .success { color: #16a34a; }
        .error { color: #dc2626; }
        pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; font-size: 14px; }
        .card { background: white; padding: 2rem; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="card">
        <h1>Auth Callback Result</h1>
        <h2 id="status">Checking authentication status...</h2>
        <pre id="data">No data yet.</pre>
        <a href="/" style="display:inline-block; margin-top:20px; color: #4F46E5;">&larr; Back to Home</a>
    </div>

    <script>
        const supabase = window.supabase.createClient('${supabaseUrl}', '${supabaseKey}');

        async function checkSession() {
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
                statusEl.innerText = '✅ Successfully Authenticated!';
                // Let's dump the entire session and user object to see exactly what Google provided
                dataEl.innerText = JSON.stringify({
                    full_session_object: session
                }, null, 2);
            } else {
                statusEl.className = 'error';
                statusEl.innerText = 'No session found.';
                dataEl.innerText = 'Make sure you were redirected here from the Google login flow.';
            }
        }

        checkSession();

        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                checkSession();
            }
        });
    </script>
</body>
</html>
`;

// ---------------------------------------------------------
// 3. SERVER SETUP
// ---------------------------------------------------------
const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '') {
        // Serve the Home Page with the button
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexPage);
    } else if (req.url.startsWith('/auth/callback')) {
        // Serve the Callback Page
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(callbackPage);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

server.listen(port, () => {
    console.log('');
    console.log('✅ Local test server running!');
    console.log('👉 Open this URL in your browser to test the login button:');
    console.log('   http://localhost:' + port + '/');
    console.log('');
    console.log('Waiting for connections...');
});
