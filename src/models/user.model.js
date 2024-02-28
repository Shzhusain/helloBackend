import mongoose, { Schema } from "mongoose";
import  Jwt  from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({

    username : {

        type : String,
        require: true,
        unique : true,
        lowercase:true,
        trim:true,
        index:true
    },
    email : {

        type : String,
        require: true,
        unique : true,
        lowercase:true,
        trim:true
        
    },
    fullname : {

        type : String,
        require: true,
        trim:true,
        index:true
    },
    avatar : {

        type : String, //we use cloudinary url
        require: true,
        
       
    },
    coverImage : {

        type : String, //we use cloudinary url
    },
    watchHistory: [

        {
            type: Schema.Types.ObjectId,
            ref:"Video"
        }


    ],
    password:{

        type : String,
        require : [true,"password is required"]

    },
    refreshTokan:{
        type: String
    }
 
},{timestamps:true})

////////////////////bcryptLogic////////////////////
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    this.password= bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(){
    return await bcrypt.compare(password,this.password)
}

////////////////////JWTLogic/////////////////////////////

userSchema.method.generateAccessToken= function(){

    return Jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname 

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }


    )

}
userSchema.method.generateRefreshToken= function(){

    return Jwt.sign(
        {
            _id:this._id,
        
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }


    )
    
}




export const User = mongoose.model("User",userSchema)