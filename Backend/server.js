import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import cookieParser from 'cookie-parser'
import userRouter from './routes/userRoutes.js'
import imageRouter from './routes/imageRoutes.js'

const app = express()
const PORT = process.env.PORT
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(cookieParser());
app.use(express.json())



app.use('/api/user',userRouter)
app.use('/api/image',imageRouter)

app.listen(PORT,()=>{
    console.log(`Running On Port No ${PORT}`)
    connectDB()
})