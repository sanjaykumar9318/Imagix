import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import cookieParser from 'cookie-parser'
import userRouter from './routes/userRoutes.js'
import imageRouter from './routes/imageRoutes.js'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
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
if (process.env.NODE_ENV === "production") {
  app.use(
    express.static(path.join(__dirname, "../../frontend/dist")) 
    // Treat this frontend/dist folder as a folder containing files that I can serve to the browser.
  );

  app.get("/{*any}", (req, res) => {
    res.sendFile(
      path.join(__dirname, "../../frontend/dist/index.html")
      // Send the React application's index.html to the browser
    );
  });
}

app.listen(PORT,()=>{
    console.log(`Running On Port No ${PORT}`)
    connectDB()
})