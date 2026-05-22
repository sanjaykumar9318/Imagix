import userModel from "../models/userModel.js";
import bcrypt from 'bcryptjs'
import genToken from "../lib/utils.js";


export const registerUser = async(req,res)=>{
    const{name,email,password} = req.body
    try{
        if(!name || !email || !password){
            return res.status(400).json({message:"Please fill all the fields"});
        }
        if (password.length<6){
            return res.status(400).json({message:"Password length should be atleast 6 characters"});
        }
        const user=await userModel.findOne({email});
        if(user){
            return res.status(400).json({message:"User already exists"});
        }
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);

        const newUser = new userModel({
            name:name,email:email,password:hashedPassword
        })
        if(newUser){
            await newUser.save();
            genToken(newUser._id,res);
            res.status(201).json({
                _id:newUser._id,
                email:newUser.email,
                name:newUser.fullname,
        })}
        else{
            res.status(400).json({message:"invalid user"});
        }
    }
    catch(err){
         console.log("error in signup controller",err.message)
         res.status(500).json({message:"internal server error"});
    }
}

export const loginUser = async(req,res)=>{
    const {email,password} = req.body
    const user=await userModel.findOne({email});
        if(!user){
            return res.status(400).json({message:"User not found"});
        }

        const ispassword=await bcrypt.compare(password,user.password)
        if(!ispassword){
            return res.status(400).json({message:"Invalid credentials"});
        }
        genToken(user._id,res);
        res.status(200).json({
            _id:user._id,
            email:user.email,
            name:user.name
        })
}

export const userCredits = async (req, res) => {
    try {
        const user = req.user;

        res.json({
            success: true,
            credits: user.creditBalance,
            user: {
                name: user.name
            }
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Server error" });
        res.status(200).json({message:"Logout successful"});

    }
};

export const logoutUser = async(req,res)=>{
    try{
        console.log("logout route hit");
        res.clearCookie("jwt")
        res.status(200).json({message:"Logout successful"});
        
    }
    catch(err){
        console.log("Error in logout controller",err.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}