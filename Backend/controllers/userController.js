import userModel from "../models/userModel.js";
import bcrypt from 'bcryptjs'
import genToken from "../lib/utils.js";
import razorpay from 'razorpay'
import transactionModel1 from "../models/transcationModel.js";
import crypto from "crypto";

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
        res.cookie("jwt", "", { maxAge: 0 });
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
    const userId = req.user._id;
    const { planId } = req.body;

    if (!userId || !planId) {
      return res.json({
        success: false,
        message: "Missing Details",
      });
    }

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    let credits;
    let plan;
    let amount;

    switch (planId) {
      case "Basic":
        credits = 100;
        plan = "Basic";
        amount = 10;
        break;

      case "Advanced":
        credits = 500;
        plan = "Advanced";
        amount = 50;
        break;

      case "Business":
        credits = 5000;
        plan = "Business";
        amount = 250;
        break;

      default:
        return res.json({
          success: false,
          message: "Plan not found",
        });
    }

    // Create our own transaction first
    const newTransaction = await transactionModel1.create({
      userId,
      plan,
      amount,
      credits,
      status: "pending",
    });

    // Create Razorpay order
    const options = {
      amount: amount * 100,
      currency: process.env.CURRENCY,
      receipt: newTransaction._id.toString(),
    };

    try {
      const order = await razorpayInstance.orders.create(options);

      // Store Razorpay order ID in our database
      await transactionModel1.findByIdAndUpdate(newTransaction._id, {
        razorpayOrderId: order.id,
      });

      return res.json({
        success: true,
        order,
      });
    } catch (error) {
      // Razorpay order failed, so mark our transaction as failed
      await transactionModel1.findByIdAndUpdate(newTransaction._id, {
        status: "failed",
      });

      console.log(error);

      return res.json({
        success: false,
        message: "Unable to create payment order",
      });
    }
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: error.message,
    });
  }
}

export const verifyRazorpay = async (req, res) => {
    try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const userId = req.user._id;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment details",
      });
    }

    // 1. Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // 2. Find our transaction
    const transactionData = await transactionModel1.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!transactionData) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // 3. Make sure this transaction belongs to logged-in user
    if (transactionData.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized transaction",
      });
    }

    // 4. Prevent duplicate crediting
    if (transactionData.status === "paid") {
      return res.json({
        success: true,
        message: "Payment already processed",
      });
    }

    // 5. Fetch order directly from Razorpay
    const orderInfo = await razorpayInstance.orders.fetch(
      razorpay_order_id
    );

    // 6. Verify amount and currency
    const expectedAmount = transactionData.amount * 100;

    if (
      orderInfo.amount !== expectedAmount ||
      orderInfo.currency !== process.env.CURRENCY
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount mismatch",
      });
    }

    // 7. Verify Razorpay order is paid
    if (orderInfo.status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    // 8. Save payment ID
    await transactionModel1.findByIdAndUpdate(
      transactionData._id,
      {
        razorpayPaymentId: razorpay_payment_id,
      }
    );

    // 9. Add credits
    await userModel.findByIdAndUpdate(
      transactionData.userId,
      {
        $inc: {
          creditBalance: transactionData.credits,
        },
      }
    );

    // 10. Mark transaction as paid
    await transactionModel1.findByIdAndUpdate(
      transactionData._id,
      {
        status: "paid",
      }
    );

    return res.json({
      success: true,
      message: "Credits Added",
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
