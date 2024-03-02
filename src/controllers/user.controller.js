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

export default registerUser;
