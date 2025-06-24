import mongoose from "mongoose"

const userSchema = new mongoose.Schema({ //may upgrade the schema as needed
    email:{
        type: String,
        required:true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    role:{
        type:String,
        default:"user", //by default all are users, initially in the db, may change as one user to admin
        enum:["user","moderator","admin"] //the values that can be given 
    },
    skills:[String], //array of strings
    createdAt:{
        type: Date,
        default:Date.now
    }
})

export default mongoose.model("User",userSchema)