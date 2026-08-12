const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const friendsRoutes = require('./routes/friends');
const billingRoutes = require('./routes/billing');
const restaurantsRoutes = require('./routes/restaurants');
const docsRoutes = require('./routes/docs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Plates Backend API', timestamp: new Date().toISOString() });
});

// Interactive API Tester Dashboard
app.use('/docs', docsRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/restaurants', restaurantsRoutes);

// Root route redirects/serves Dashboard
app.use('/', docsRoutes);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Start Server if called directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 Plates Express API Server running on http://localhost:${PORT}`);
    console.log(`📊 Interactive API Dashboard available at http://localhost:${PORT}/docs`);
    console.log('====================================================');
  });
}

module.exports = app;
