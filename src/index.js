import dotenv from "dotenv";
import connectDB from './db/index.js';

dotenv.config({
  path : './env'
})

connectDB();








/*
const express = require('express');
const app = express();
;(async()=>{
    try {
      await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      app.on("error",()=>{
        console.error("ERRR: ",error);
        throw error
      })
      app.listen(process.env.PORT,()=>{
        log(`App is listening on port ${process.env.PORT}`)
      })
    }catch(error){
        console.error("ERROR: ",error);
        throw error
    }
})(); */