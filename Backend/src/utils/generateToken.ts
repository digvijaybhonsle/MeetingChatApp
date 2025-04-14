// util/generateToken.ts
import jwt from "jsonwebtoken";

// Generate a JWT token for the user
const generateToken = (userId: string): string => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    return token;
  } catch (error) {
    throw new Error("Token generation failed");
  }
};

export default generateToken;