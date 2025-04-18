// types/express/index.d.ts
import { User } from "./src/models/user"; // Adjust path based on your project

declare global {
  namespace Express {
    interface Request {
      user?: User, // Add your actual user type here if you have one
      id: string;
    }
  }
}