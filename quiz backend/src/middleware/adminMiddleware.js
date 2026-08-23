const adminMiddleware = (req, res, next) => {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({
      message: "Access denied. Admin only.",
    });
  }

  next();
};

export default adminMiddleware;
