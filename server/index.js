import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import videoRoutes from "./routes/videos.js";
import commentRoutes from "./routes/comments.js";
import Video from "./models/Video.js";

const uri = 'MONGO= mongodb+srv://sachigcloudf2022:9SvpoUsyNmapee9h@sachidanandsahu.r0yth.mongodb.net/youtubeclone?retryWrites=true&w=majority&appName=SachidanandSahu'; // Replace with your MongoDB connection string
let db;


const app = express();
dotenv.config();

// const connect = () => {
//     mongoose.connect(process.env.MONGO, {
//         useUnifiedTopology: true,
//         useNewUrlParser: true
//     }).then(() => {
//         console.log("Connected to MongoDB");
//     }).catch(err => {
//         console.log("Error connecting to MongoDB:", err);
//     });
// }

const connect = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGO, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
        db = connection.connection.db; // Set the db variable
        console.log("Connected to MongoDB");
    } catch (err) {
        console.log("Error connecting to MongoDB:", err);
    }
};


app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/comments", commentRoutes);

app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Something went wrong";
    res.status(status).json({
        success: false,
        message,
        status
    });
});

const saveVideo = async () => {
    const videos_json =     [];

      const items = videos_json; // Assuming `items` is passed in the request body

      if (!Array.isArray(items)) {
          return res.status(400).json({ success: false, message: "Invalid data format" });
      }
  
      const videos = items.map(item => ({
          userId: item.snippet.channelId, // Assuming the channelId is used as userId
          title: item.snippet.title,
          desc: item.snippet.description,
          imgUrl: item.snippet.thumbnails.high.url, // Using the high-res thumbnail
          videoUrl: `https://www.youtube.com/watch?v=${item.id}`, // Assuming a YouTube link
          views: Number(item.statistics.viewCount), // Converting string to number
          tags: item.snippet.tags || [], // Using provided tags or an empty array
          likes: [], // You can initialize likes if needed
          dislikes: [] // You can initialize dislikes if needed
      }));
  
      try {
          const savedVideos = await Video.insertMany(videos);
          res.status(201).json({ success: true, message: "Videos saved successfully!", savedVideos });
      } catch (error) {
          console.error("Error saving videos:", error);
          res.status(500).json({ success: false, message: "Error saving videos", error });
      }
};


const PORT = process.env.PORT || 8800;
app.listen(PORT, async () => {
    await connect()
    // await saveVideo()
    console.log(`App is running on port ${PORT}`);
});