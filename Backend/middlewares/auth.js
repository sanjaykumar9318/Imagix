import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const authUser = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({
                message: "unauthorized: no token provided"
            });
        }

        const decode = jwt.verify(token, process.env.SECRET_KEY);

        if (!decode) {
            return res.status(401).json({
                message: "unauthorized: invalid token"
            });
        }

        const user = await userModel
            .findById(decode.userID)   // FIXED HERE
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "user not found"
            });
        }

        req.user = user;   // FIXED (not req.userId)
        next();

    } catch (err) {
        console.log("error in protect middleware", err.message);
        return res.status(500).json({
            message: "internal server error"
        });
    }
};

export default authUser;