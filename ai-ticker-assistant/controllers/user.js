import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../models/user-model"
import {inngest} from "../inngest"

export const signup = async (req,res) => {
    const {email,password,skills:[]} = req.body

    try{
       const hashedPassword = bcrypt.hash(password,10)
       const user = await User.create({email,password:hashedPassword,skills})

       //fire the inngest event 
      /* we can do fire the inngest events as per our requirement. we can fire it an make it run at the same time go with other operations
       or can do as wair for the event to be executed and after its execution, make other operations execute(await), all depends on the usecase*/
        

       await inngest.send({ //calling the inngest event named user/signup (in the on-signup.js) and pass the data used there
        name: "user/signup",
        data:{
            email
        }
    })
    const token = jwt.sign({
        _id: user._id,role:user.role
      }, process.env.JWT_SECRET
    )

    res.json({user,token})

    }catch(error){
      res.status(500).json({error:"signup failed", details: error.message})
    }
}

export const login = async (req,res)=>{
    const {email,password} = req.body 

    try{
      const user =  User.findOne({email})
      if(!user) return res.status(401).json({success: false, error:"User not found"})

       const isMatch = await bcrypt.compare(password,user.password)

       if(!isMatch){
           return res.status(401).json({error:"Invalid credentials"})
       }

       const token = jwt.sign({
        _id: user._id,role:user.role
      }, process.env.JWT_SECRET
    )

    res.json({token})

    }catch(error){
      res.status(500).json({error:"login failed", details: error.message})
    }
}
