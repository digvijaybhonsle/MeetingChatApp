import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Extend the Express Request interface to include user
declare global {
    namespace Express {
      interface Request {
        user?: any; // Define the user property in the Request object
      }
    }
  }

const protect = (req: Request, res: Response, next: NextFunction) => {
  // Get the token from the Authorization header
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    // Verify the token and decode the user
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Attach the user info to the request object for further use in routes
    req.user = decoded.user; // Assuming the decoded token has a 'user' property

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).json({ error: "Token is not valid or expired" });
  }
};

export { protect };
