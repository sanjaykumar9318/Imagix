import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import cookieParser from 'cookie-parser'
import userRouter from './routes/userRoutes.js'
import imageRouter from './routes/imageRoutes.js'
import path from "path"

const app = express()
const PORT = process.env.PORT
// for deployement
const __dirname = path.resolve()

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(cookieParser());
app.use(express.json())
// for deployement
if(process.env.NODE_ENV==="production"){
  app.use(express.static(path.join(__dirname,"../Frontend/dist"))) //if in prod make this dist folder as static acid
  app.get("*",(req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/dist/index.html"));
  });
}




app.use('/api/user',userRouter)
app.use('/api/image',imageRouter)

app.listen(PORT,()=>{
    console.log(`Running On Port No ${PORT}`)
    connectDB()
})