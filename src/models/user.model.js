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

export const User = mongoose.model("User",userSchema)