const { User } = require('../models');
const { Op } = require('sequelize');

const getCurrentUser = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, status, avatar_url } = req.body;
    
    const updates = {};
    if (username) updates.username = username;
    if (status !== undefined) updates.status = status;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    await req.user.update(updates);

    res.json({
      message: 'Profile updated successfully',
      user: req.user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } }
        ],
        id: { [Op.ne]: req.userId }
      },
      attributes: ['id', 'username', 'email', 'avatar_url', 'status', 'is_online', 'last_seen'],
      limit: 20
    });

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'email', 'avatar_url', 'status', 'is_online', 'last_seen']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

module.exports = {
  getCurrentUser,
  updateProfile,
  searchUsers,
  getUserById
};
