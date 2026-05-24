import userModel from "../models/userModel.js";
import bcrypt from 'bcryptjs'
import genToken from "../lib/utils.js";
import razorpay from 'razorpay'
import transactionModel from "../models/transcationModel.js";

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

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// Payment API to add credits
export const paymentRazorpay = async (req, res) => {
    try {
        const userId = req.user._id
        const { planId } = req.body
        const userData = await userModel.findById(userId)
        // checking for planId and userdata
        if (!userData || !planId) {
            return res.json({ success: false, message: 'Missing Details' })
        }
        let credits, plan, amount, date
        // Switch Cases for different plans
        switch (planId) {
            case 'Basic':
                plan = 'Basic'
                credits = 100
                amount = 10
                break;
            case 'Advanced':
                plan = 'Advanced'
                credits = 500
                amount = 50
                break;
            case 'Business':
                plan = 'Business'
                credits = 5000
                amount = 250
                break;
            default:
                return res.json({ success: false, message: 'plan not found' })
        }
        date = Date.now()
        // Creating Transaction Data
        const transactionData = {
            userId,
            plan,
            amount,
            credits,
            date
        }
        // Saving Transaction Data to Database
        const newTransaction = new transactionModel(transactionData)
        await newTransaction.save()
        // Crating options to create razorpay Order
        const options = {
            amount: amount * 100,
            currency: process.env.CURRENCY,
            receipt: newTransaction._id,
        }
        // Creating razorpay Order
        await razorpayInstance.orders.create(options, (error, order) => {
            if (error) {
                console.log(error);
                return res.json({ success: false, message: error });
            }
            res.json({ success: true, order });
        })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export const verifyRazorpay = async (req, res) => {
    try {

        const { razorpay_order_id } = req.body;
        // Fetching order data from razorpay
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
        // Checking for payment status
        if (orderInfo.status === 'paid') {
            const transactionData = await transactionModel.findById(orderInfo.receipt)
            if (transactionData.payment) {
                return res.json({ success: false, message: 'Payment Failed' })
            }
            // Adding Credits in user data
            const userData = await userModel.findById(transactionData.userId)
            const creditBalance = userData.creditBalance + transactionData.credits
            await userModel.findByIdAndUpdate(userData._id, { creditBalance })
            // Marking the payment true 
            await transactionModel.findByIdAndUpdate(transactionData._id, { payment: true })
            res.json({ success: true, message: "Credits Added" });
        }
        else {
            res.json({ success: false, message: 'Payment Failed' });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
