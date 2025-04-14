// util/hashPassword.ts
import bcrypt from "bcrypt";

// Hash the password using bcrypt with a salt rounds value of 10
const hashPassword = async (password: string): Promise<string> => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  } catch (error) {
    throw new Error("Password hashing failed");
  }
};

export default hashPassword;
