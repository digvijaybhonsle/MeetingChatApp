import bcrypt from "bcryptjs";

const hashPassword = async (password: string): Promise<string> => {
  if (!password || typeof password !== "string") {
    throw new Error("Invalid password input");
  }

  try {
    const saltRounds = 10;
    const hashed = await bcrypt.hash(password.trim(), saltRounds);
    return hashed;
  } catch (error) {
    console.error("Hashing error:", error);
    throw new Error("Password hashing failed");
  }
};

export default hashPassword;
