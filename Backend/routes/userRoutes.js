import express from 'express'
import {
    registerUser,
    loginUser,
    userCredits,logoutUser,paymentRazorpay,verifyRazorpay
} from '../controllers/UserController.js'
import authUser from '../middlewares/auth.js'

const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.get('/credits', authUser, userCredits)
userRouter.post('/logout',logoutUser)
userRouter.post('/pay-razor', authUser, paymentRazorpay)
userRouter.post('/verify-razor', verifyRazorpay)


export default userRouter 