import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
     {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    plan: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    credits: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    date: {
      type: Number,
      default: Date.now,
    },
  },
  { timestamps: true })

const transactionModel1 = mongoose.models.transaction1 || mongoose.model("transaction1", transactionSchema);

export default transactionModel1;