import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

import userRoutes from './routes/user-route'

const PORT = process.env.PORT || 3004
const app=express()
app.use(cors()) //actually cors act as a middleware
app.use(express.json())
app.use(express.urlencoded({extended:true}))


app.use("/api/auth",userRoutes)

//here we have done in a way that it connects to mongodb and if suceess then listens to the app via port
mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("MongoDB connected")
    app.listen(PORT,()=> console.log(`server at http://localhost:${PORT}`))
})
.catch((err)=> console.error("MongoDB error: ",err))