// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/auth.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // 1. Get token from cookies
    const token = req.cookies?.token;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated - no token" });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token payload" });
    }

    // 3. Fetch user from DB
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 4. Attach user to request object
    req.user = user;

    // 5. Continue
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};
