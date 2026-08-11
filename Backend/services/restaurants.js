/**
 * Restaurant & Foods Module
 */
const supabase = require('../supabase');

/**
 * Fetches a specific restaurant along with its full food menu using a database join.
 * @param {string} restaurantId - UUID of the restaurant.
 * @returns {Promise<Object>} Restaurant object with `foods` array attached.
 */
async function getRestaurantWithMenu(restaurantId) {
  try {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        location,
        description,
        image_url,
        created_at,
        foods (
          id,
          name,
          price,
          description,
          image_url
        )
      `)
      .eq('id', restaurantId)
      .single();

    if (error) throw error;
    return restaurant;
  } catch (error) {
    console.error('Error fetching restaurant with menu:', error.message);
    throw error;
  }
}

/**
 * Fetches all restaurants in the directory.
 */
async function getAllRestaurants() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, location, description, image_url')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

module.exports = {
  getRestaurantWithMenu,
  getAllRestaurants
};
