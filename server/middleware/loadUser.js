const User = require('../models/User');

// Resolves req.user.cognitoId to a Mongo User document and attaches it as req.dbUser.
// Must run after the auth middleware.
module.exports = async function loadUser(req, res, next) {
  try {
    const user = await User.findOne({ cognitoId: req.user.cognitoId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    req.dbUser = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
