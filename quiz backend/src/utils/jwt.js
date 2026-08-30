import jwt from "jsonwebtoken";

export function signToken(userId, role) {
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in .env");
  }

  return jwt.sign(
    {
      userId,
      role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  );
}

export function verifyToken(token) {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in .env");
  }

  return jwt.verify(token, JWT_SECRET);
}
