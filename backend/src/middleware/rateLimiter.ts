import rateLimit from "express-rate-limit";

// General rate limiter: 100 requests per minute
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter: 10 requests per minute
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload rate limiter: 20 uploads per minute
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many upload requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
