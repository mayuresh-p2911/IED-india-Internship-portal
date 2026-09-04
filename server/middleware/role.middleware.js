const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const isAuthorized = roles.includes(userRole) || (roles.includes('admin') && userRole === 'superadmin');
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: `Role '${userRole}' is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = { authorize };
