import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js"
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
    const { fullName, password, email } = req.body;
    try {
        if (!fullName || !email || !password) return res.status(400).json({message: "All field are required"});
        if (password.length < 6) return res.status(400).json({message: "Password must be at least 6 characters"});

        const user = await User.findOne({email});
        if (user) return res.status(400).json({message: "Email already exists"});

        const hashPassword = await bcrypt.hashSync(password, 10);

        const newUser = new User({
            fullName,
            password: hashPassword,
            email
        })

        if (newUser){
            generateToken(newUser._id, res);
            await newUser.save();

            return res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic
            })
        } else {
            return res.status(400).json({message: "Invalid user data"});
        }
    } catch (error) {
        console.log("Error in signup controller", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) return res.status(400).json({message: "All field are required"});
        const user = await User.findOne({email});
        if (!user) return res.status(400).json("Invalid credentials");
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({message: "Invalid credentials"});

        generateToken(user._id, res);
        return res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic
        })
    } catch (error) {
        console.log("Error in login controller", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

export const signout = async (req, res) => {
    try {
        res.cookie("token", "", {maxAge: 0});
        return res.status(200).json({message: "Logged out successfully"});
    } catch (error) {
        console.log("Error in signout controller", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

export const updateProfile = async(req, res) => {
    const { profilePic } = req.body;
    try {
        if (!profilePic) return res.status(400).json({message: "Profile pic is required"});
        const userId = req.user._id;
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updateUser = await User.findByIdAndUpdate(userId, {profilePic: uploadResponse.secure_url}, {new: true});
        
        return res.status(200).json(updateUser);
    } catch (error) {
        console.log("Error in updateProfile controller", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

export const checkAuth = async(req, res) => {
    try {
        return res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller");
        return res.status(500).json({message: "Internal Server Error"});
    }
}