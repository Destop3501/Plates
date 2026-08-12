const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getRestaurantWithMenu, getAllRestaurants } = require('../services/restaurants');
const supabase = require('../supabase');

/**
 * GET /api/restaurants
 * List all restaurants in the directory.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const restaurants = await getAllRestaurants();
    res.json({ restaurants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/restaurants/:id
 * Get details of a single restaurant with its full food menu items.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const restaurant = await getRestaurantWithMenu(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json({ restaurant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/restaurants
 * Add a new restaurant to the directory.
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, location, description, imageUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Restaurant name is required.' });
    }

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert([{ name, location, description, image_url: imageUrl }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Restaurant created successfully', restaurant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/restaurants/:id/foods
 * Add a food item to a restaurant menu.
 */
router.post('/:id/foods', authenticate, async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const { name, price, description, imageUrl } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Food name and price are required.' });
    }

    const { data: food, error } = await supabase
      .from('foods')
      .insert([
        {
          restaurant_id: restaurantId,
          name,
          price: parseFloat(price),
          description,
          image_url: imageUrl
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Food item added to menu', food });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
