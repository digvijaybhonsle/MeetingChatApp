import jwt from "jsonwebtoken";
const protect = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ success: false, error: "Not authorized, token missing" });
        return; // just return void, don't return the response
    }
    const token = authHeader.replace("Bearer ", "");
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, error: "Not authorized, token invalid" });
    }
};
export { protect };
