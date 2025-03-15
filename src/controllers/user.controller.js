import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt  from 'jsonwebtoken';

const generateAccessAndRefreshTokens = async(userId)=>{
   // console.log(userId);
   
   try {
      const user = await User.findById(userId)
      // console.log(user);
      
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({validateBeforeSave : false})
      console.log("accessToken ->",accessToken);
      console.log("refreshToken :->",refreshToken);
      
      return {accessToken,refreshToken}

   } catch (error) {
      throw new ApiError(500,"something went wrong while generating refresh and access token")
      
   }
}

const registerUser = asyncHandler(async(req,res)=>{
   // get user details from frontend
   // validation - not empty 
   // check if user already exists : username, password 
   // check for images, check for avatar
   // upload them  cloudinary, avatar
   // create user object - create entry in db
   // remove password and refresh token field from response
   // check  for user creation
   // return res

   const {fullname, email, username, password} =req.body
   console.log("body : ", req.body);

   if (
      [fullname, email, username, password].some((field)=> field?.trim() === "")
   ) {
      throw new ApiError(400, "all fields are required")
   }

   const existedUser = await User.findOne({
      $or : [{username},{email}]
   })

   if (existedUser){
      throw new ApiError(409,"User with email or username already exist")
   }

   // const avatarLocalPath =req.files?.avatar[0]?.path;
   // const coverImageLocalPath =req.files?.coverImage[0]?.path;
   // console.log("res.files-> :: ",res.files);

   // let coverImageLocalPath ;
   // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
   //    coverImageLocalPath = req.files.coverImage[0].path
   // }

   // avatar
   // if (!avatarLocalPath) {
   //    throw new ApiError(400, "Avatar file is required")
   // }

   // const avatar=await uploadOnCloudinary(avatarLocalPath);
   // const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   // console.log("avatar :: ",avatar);
   // console.log("coverIMAGE :: ",coverImage);

   // avatar required compulsory
   // if(!avatar){
   //    throw new ApiError(400, "Avatar file is required")

   // }

   const user = await User.create({
      fullname,
      // avatar : avatar?.url || "",
      // coverImage : coverImage?.url || "",
      avatar : "",
      coverImage : "",
      email,
      password,
      username : username.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )
   if (!createdUser) {
      throw new ApiError(500, "something went wrong while registering the user");
      
   }

   return res.status(201).json(
      new ApiResponse(200, createdUser, "User register successfully")
   )
})

const loginUser = asyncHandler(async(req,res)=>{
   // get data from frontend
   // username or email
   // find the user
   //  password check
   // access and refresh token
   // send cookie

   const {email,username,password} = req.body

   if (!username && !email){
      throw new  ApiError(400, "username or email required")
   }

   // here is an alternative of above code based on logic discuss
   //if (!(username && email)){
   //   throw new  ApiError(400, "username or email required")
  // }

   const user= await User.findOne({
      $or : [{username},{email}]
   })

   if (!user) {
      throw new ApiError(404,"user does not exist")
      
   }

const isPasswordValid=   await user.isPasswordCorrect(password)
if (!isPasswordValid) {
   throw new ApiError(401,"invalid user credentials")
}

   const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);
   // console.log(user._id);
   

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken") // select is use for removing mention data 
   const options = {
      httpOnly: true,
      secure : true
   }

   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
      new ApiResponse(200,
         {
            user : loggedInUser,
            accessToken,
            refreshToken
         },
         "user logged In Successfully"
      )
   )
   

})


const logoutUser = asyncHandler(async(req,res)=>{
      await User.findByIdAndUpdate(
         req.user.id,
         {
            $set : {
               refreshToken : undefined
            }
         },
         {
            new : true
         }
      )

      const options = {
         httpOnly: true,
         secure : true
      }


      return res
      .status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(new ApiResponse(200,"User Logged Out"))

})

const refreshAccessToken = asyncHandler(async ()=>{
  const incomingRefreshToken =  req.cookie.refreshToken || req.body.refreshToken 
  if(incomingRefreshToken){
   throw new ApiError(401,"unauthorized request");
  }
  try {
   const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
 )
 const user = await User.findById(decodedToken?._id)
 
 if(!user){
    throw new ApiError(401,"Invalid refresh token");
   }
 
    if (incomingRefreshToken !== user?.refreshToken) {
       throw new ApiError(401,"Refresh token is expired or used");
       
    }
 
    const options = {
       httpOnly : true,
       secure : true
    }
 
    const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
    return res 
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
       new ApiResponse(200,{accessToken,refreshToken : newRefreshToken},"Access token refresh")
    )
  } catch (error) {
      throw new ApiError(401,error?.message || "Invalid refresh token")
   
  }

  
})

export {registerUser,loginUser,logoutUser,refreshAccessToken}