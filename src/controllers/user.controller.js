import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";



//get user details from backend
//validation-not empty
//check if user already exist - through email or username
//check for images check for avatar
//upload them to cloudinary ,avatar
//create user objact and create entry in DB
//remove password and refresh tokan field from response
//check for user creation is or not
// return response

const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, fullName, password } = req.body;

  /////////// ek ek feild check krn ka leya hum ya follow kr skta hn//////

  // if(userName ==="")
  // throw new ApiError(400,"fullName is required")

  ////////////For Mutlple Fiels Validation Not Empity Check///////////

  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required");
  }

  ////////check if user already exist - through email or username////////

  const existingUser = await User.findOne({ $or: [{ userName }, { email }] });

  if (existingUser) {
    throw new ApiError(409, "user is already exist");
  }

  ////////////////check for image check for avatar /////////////////////

  const avatarLocalPath = req.files?.avatar[0]?.path;

  // const coverImageLocalPath=req.field?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  /////////////////upload them to cloudinary ,avatar////////////////////

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  ///////////////create user objact and create entry in DB/////////////

  const user = await User.create({
    userName: userName.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  ////////remove password and refresh tokan field from response////////

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  ///////////////// //check for user creation is or not/////////////////

  if (!createdUser) {
    throw new ApiError(500, "somthing went wrong");
  }

  ////////////////////////// return response//////////////////////////

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "user register successfully"));
});

///////////////////////////// Login User ///////////////////////////



const generateAccessAndRefreshToken=async (userId)=>{
  try {

    const user=await User.findById(userId)

    const accessToken=user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()

    //add or save refreshtoken in database
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}

     
    
  } catch (error) {
    throw new ApiError(500,"somthing went wrong while generateAccessAndRefreshToken")
  }



}

//Get user data from req body
//access data to put username or password
//find the user
//if user found check passowrd >> correct or incorrect
//if password correct >> generate access and refresh tokan and send to user
//send in secure cookies
//send response
 
const loginUser = asyncHandler(async(req,res)=>{

  //Get user data from req body

  const {email,userName,password}=req.body;

  if (!(userName || email)) {

    throw new ApiError(400,"username or email is required")
    
  }

  //find the user

  const user= await User.findOne({
    $or:[{userName},{email},{password}]
   })

   if (!user) {
    throw new ApiError(404,"user is not available")
    
   }

   //if user found check passowrd >> correct or incorrect

   const isPasswordValid=await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401,"password is incorrect")
    
   }

   //if password correct >> generate access and refresh tokan and send to user

   const {accessToken,refreshToken}=await 
   generateAccessAndRefreshToken(user._id)

   ////////////////////////////////////////////////
   const loggedInUser= await User.findById(user._id).select("-password -refreshToken")
   ///////////////////////////////////////////////


   //send in secure cookies

   const options={
    httpOnly:true,
    secure:true
   }

   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json( new ApiResponse(200,{

    user:loggedInUser,accessToken,refreshToken
    
   },
   "user loggedin Successfully"
   
   ))

})


////////////////////////////Logout User/////////////////////////////////


const logoutUser = asyncHandler(async (req, res) => {
  // Update user's refreshToken to undefined
  const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { refreshToken: undefined } },
      { new: true } // Return the updated document
  );

  if (!updatedUser) {
      throw new ApiError(404, "User not found");
  }

  // Options for clearing cookies
  const options = {
      httpOnly: true,
      secure: true,
  };

  // Clear access and refresh tokens cookies and send logout response
  return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out"));
});
export { registerUser, loginUser,logoutUser };
