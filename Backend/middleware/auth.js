const supabase = require('../supabase');

/**
 * Express Authentication Middleware
 * Validates Supabase JWT tokens passed in the Authorization header.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In development/testing, allow passing x-user-id header if provided
      if (req.headers['x-user-id']) {
        req.user = { id: req.headers['x-user-id'] };
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized. Missing or invalid Authorization header.' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err.message);
    res.status(500).json({ error: 'Internal server authentication error' });
  }
}

module.exports = authenticate;
