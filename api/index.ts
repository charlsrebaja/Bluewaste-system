import { VercelRequest, VercelResponse } from "@vercel/node";
import "../backend/src/index";

export default async (req: VercelRequest, res: VercelResponse) => {
  // Import and initialize your Express app
  const { app } = require("../backend/src/index");
  return app(req, res);
};
