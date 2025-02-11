import dotenv from "dotenv";
import connectDB from './db/index.js';

dotenv.config({
  path : './env'
})

connectDB()
.then(()=>{
   app.listen(process.env.PORT || 8000,()=>{
    console.log(`server is running at port : ${process.env.PORT}`);
    
   });
}).catch(()=>{
  console.log("Mongo db connection failed !!! ", error);
  
});








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