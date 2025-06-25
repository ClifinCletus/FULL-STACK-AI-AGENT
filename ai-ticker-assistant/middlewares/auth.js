import jwt from 'jsonwebtoken'

export const authenticate= (req,res,next)=>{
    const token = req.headers.authorization?.split(" ")[1]

    if(!token){
        return res.status(401).json({error:"Access denied, No token found."})
    }

    try{ //getting the full information of the user, same as in auth project
     const decoded =  jwt.verify(token,process.env.JWT_SECRET)
     req.user = decoded
     next()
    }
    catch(error){
       res.status(401).json({error:"Invalid toke"})
    }
}