import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "24h" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string };
};
