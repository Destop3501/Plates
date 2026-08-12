const express = require('express');
const router = express.Router();

const dashboardHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plates API Tester Dashboard</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --border: #334155; --text: #f8fafc; --muted: #94a3b8; --get: #10b981; --post: #3b82f6; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 2rem; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
        .header h1 { font-size: 2rem; margin: 0 0 0.5rem 0; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .header p { color: var(--muted); margin: 0; }
        
        .section-title { font-size: 1.25rem; color: #38bdf8; margin: 2rem 0 1rem 0; border-left: 4px solid #38bdf8; padding-left: 10px; }
        
        .api-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 1rem; padding: 1.25rem; }
        .api-header { display: flex; align-items: center; gap: 12px; font-family: monospace; font-size: 1rem; }
        .method { padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 0.85rem; color: white; }
        .method.GET { background-color: var(--get); }
        .method.POST { background-color: var(--post); }
        .path { font-weight: 600; font-size: 1.05rem; }
        .desc { color: var(--muted); font-size: 0.9rem; margin-top: 6px; }
        
        .test-controls { margin-top: 1rem; display: flex; flex-direction: column; gap: 10px; }
        .input-field { background: #090d16; border: 1px solid var(--border); color: #38bdf8; padding: 8px; border-radius: 6px; font-family: monospace; font-size: 0.9rem; width: 95%; }
        button.test-btn { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; align-self: flex-start; transition: 0.2s; }
        button.test-btn:hover { background: #1d4ed8; }
        
        .response-box { display: none; margin-top: 10px; background: #000; padding: 1rem; border-radius: 6px; font-family: monospace; font-size: 0.85rem; overflow-x: auto; max-height: 250px; }
        .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; margin-bottom: 8px; font-size: 0.8rem; }
        .status-200, .status-201 { background: #166534; color: #4ade80; }
        .status-400, .status-401, .status-404, .status-500 { background: #991b1b; color: #f87171; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍽️ Plates API Tester Dashboard</h1>
            <p>Interactive playground to view and test all GET & POST backend endpoints</p>
        </div>

        <!-- 1. HEALTH & AUTH -->
        <div class="section-title">1. Health & User Authentication</div>
        
        <div class="api-card">
            <div class="api-header"><span class="method GET">GET</span> <span class="path">/api/health</span></div>
            <div class="desc">Check server status and health timestamp.</div>
            <div class="test-controls">
                <button class="test-btn" onclick="testEndpoint('GET', '/api/health', null, 'res-health')">Run GET /api/health</button>
                <div id="res-health" class="response-box"></div>
            </div>
        </div>

        <div class="api-card">
            <div class="api-header"><span class="method GET">GET</span> <span class="path">/api/auth/me</span></div>
            <div class="desc">Fetch logged-in user profile details from Supabase profiles.</div>
            <div class="test-controls">
                <button class="test-btn" onclick="testEndpoint('GET', '/api/auth/me', null, 'res-me')">Run GET /api/auth/me</button>
                <div id="res-me" class="response-box"></div>
            </div>
        </div>

        <div class="api-card">
            <div class="api-header"><span class="method POST">POST</span> <span class="path">/api/auth/logout</span></div>
            <div class="desc">Log out current authenticated user session.</div>
            <div class="test-controls">
                <button class="test-btn" onclick="testEndpoint('POST', '/api/auth/logout', null, 'res-logout')">Run POST /api/auth/logout</button>
                <div id="res-logout" class="response-box"></div>
            </div>
        </div>

        <!-- 2. FRIENDS -->
        <div class="section-title">2. Friends & Social Module</div>

        <div class="api-card">
            <div class="api-header"><span class="method GET">GET</span> <span class="path">/api/friends</span></div>
            <div class="desc">Fetch list of accepted friends.</div>
            <div class="test-controls">
                <button class="test-btn" onclick="testEndpoint('GET', '/api/friends', null, 'res-friends')">Run GET /api/friends</button>
                <div id="res-friends" class="response-box"></div>
            </div>
        </div>

        <div class="api-card">
            <div class="api-header"><span class="method POST">POST</span> <span class="path">/api/friends/request</span></div>
            <div class="desc">Send a friend request to a target user by email or ID.</div>
            <div class="test-controls">
                <textarea id="req-body-friend" class="input-field" rows="2">{\n  "email": "friend@gmail.com"\n}</textarea>
                <button class="test-btn" onclick="testEndpoint('POST', '/api/friends/request', 'req-body-friend', 'res-friend-req')">Send Friend Request</button>
                <div id="res-friend-req" class="response-box"></div>
            </div>
        </div>

        <!-- 3. BILLING & DEBTS -->
        <div class="section-title">3. Billing, Debts & Friend Bills</div>

        <div class="api-card">
            <div class="api-header"><span class="method GET">GET</span> <span class="path">/api/billing/summary</span></div>
            <div class="desc">Get financial summary (Total Owed, Total Receivable, Net Balance).</div>
            <div class="test-controls">
                <button class="test-btn" onclick="testEndpoint('GET', '/api/billing/summary', null, 'res-summary')">Run GET /api/billing/summary</button>
                <div id="res-summary" class="response-box"></div>
            </div>
        </div>

        <div class="api-card">
            <div class="api-header"><span class="method GET">GET</span> <span class="path">/api/billing/friend/:friendId</span></div>
            <div class="desc">🎯 UI Action: Click Friend -> Fetch all shared bills with that friend.</div>
            <div class="test-controls">
                <input id="friend-id-param" class="input-field" value="00000000-0000-0000-0000-000000000001" placeholder="Friend User UUID">
                <button class="test-btn" onclick="testEndpoint('GET', '/api/billing/friend/' + document.getElementById('friend-id-param').value, null, 'res-friend-bills')">Fetch Friend Bills</button>
                <div id="res-friend-bills" class="response-box"></div>
            </div>
        </div>

        <div class="api-card">
            <div class="api-header"><span class="method GET">GET</span> <span class="path">/api/billing/debts/:debtId</span></div>
            <div class="desc">📄 UI Action: Click Bill -> Fetch complete details for a single bill.</div>
            <div class="test-controls">
                <input id="debt-id-param" class="input-field" value="00000000-0000-0000-0000-000000000000" placeholder="Bill/Debt UUID">
                <button class="test-btn" onclick="testEndpoint('GET', '/api/billing/debts/' + document.getElementById('debt-id-param').value, null, 'res-debt-detail')">Fetch Bill Details</button>
                <div id="res-debt-detail" class="response-box"></div>
            </div>
        </div>

        <div class="api-card">
            <div class="api-header"><span class="method POST">POST</span> <span class="path">/api/billing/debt</span></div>
            <div class="desc">Create a new bill transaction with category tag (restaurant, shop, etc.).</div>
            <div class="test-controls">
                <textarea id="req-body-debt" class="input-field" rows="6">{\n  "payeeId": "00000000-0000-0000-0000-000000000001",\n  "amount": 28.50,\n  "description": "Grocery & Snacks",\n  "category": "shop"\n}</textarea>
                <button class="test-btn" onclick="testEndpoint('POST', '/api/billing/debt', 'req-body-debt', 'res-create-debt')">Create Bill</button>
                <div id="res-create-debt" class="response-box"></div>
            </div>
        </div>

        <!-- 4. RESTAURANTS -->
        <div class="section-title">4. Restaurant Directory & Foods</div>

        <div class="api-card">
            <div class="api-header"><span class="method GET">GET</span> <span class="path">/api/restaurants</span></div>
            <div class="desc">List all restaurants in directory.</div>
            <div class="test-controls">
                <button class="test-btn" onclick="testEndpoint('GET', '/api/restaurants', null, 'res-restaurants')">Run GET /api/restaurants</button>
                <div id="res-restaurants" class="response-box"></div>
            </div>
        </div>
    </div>

    <script>
        async function testEndpoint(method, path, bodyInputId, responseBoxId) {
            const resBox = document.getElementById(responseBoxId);
            resBox.style.display = 'block';
            resBox.innerHTML = '<span style="color:#94a3b8">Sending request...</span>';

            let bodyData = null;
            if (bodyInputId) {
                try {
                    bodyData = JSON.parse(document.getElementById(bodyInputId).value);
                } catch(e) {
                    resBox.innerHTML = '<span class="status-badge status-400">Invalid JSON Body</span>';
                    return;
                }
            }

            try {
                const options = {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': '00000000-0000-0000-0000-000000000000' // Dev test header
                    }
                };
                if (bodyData) options.body = JSON.stringify(bodyData);

                const res = await fetch(path, options);
                const data = await res.json();

                const statusClass = res.ok ? 'status-200' : 'status-400';
                resBox.innerHTML = \`<span class="status-badge \${statusClass}">HTTP \${res.status} \${res.statusText}</span><pre style="margin:0">\${JSON.stringify(data, null, 2)}</pre>\`;
            } catch (err) {
                resBox.innerHTML = \`<span class="status-badge status-500">Error: \${err.message}</span>\`;
            }
        }
    </script>
</body>
</html>
`;

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(dashboardHtml);
});

module.exports = router;
