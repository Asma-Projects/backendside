import express from "express";
import path from "path";

import bodyParser from "body-parser";
import dotenv from "dotenv";
import Promise from "bluebird";
import caught  from "caught" ;
import auth from "./routes/auth";
import users from "./routes/users";
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
import pdf from 'pdf-poppler'
const router = express.Router();


const app = express();

app.use(cors());

dotenv.config();
app.use(bodyParser.json());
mongoose.Promise = Promise;
const p = caught(Promise.reject(0));
 
setTimeout(() => p.catch(e => console.error('caught')), 0);
mongoose.connect(process.env.MONGODB_URL);

app.use("/api/auth", auth);
app.use("/api/users", users);

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

 const mongoURI = process.env.MONGODB_URL;
 const conn = mongoose.createConnection(mongoURI);

 // Init gfs
 let gfs;

 conn.once('open', () => {
   // Init stream
   gfs = Grid(conn.db, mongoose.mongo);
   gfs.collection('uploads');
 });
 const multer = require('multer');
 const storage = multer.diskStorage({ // notice you are calling the multer.diskStorage() method here, not multer()
     destination: function(req, file, cb) {
         cb(null, './uploads')
     },
     filename: function(req, file, cb) {
         cb(null, file.originalname)
     }
 });
 const upload = multer({storage}); //provide the return value from 
 // Create storage engine
 

 // @route GET /
 // @desc Loads form
 
 // @route POST /upload
 // @desc  Uploads file to DB
 app.post('/upload', upload.single('file'), (req, res) => {
   console.log('Successfully uploaded');
   
   res.redirect('/');
 });
 app.post('/convert',  upload.single('file'),(req, res) =>{

    let file = req.file.path;
 
  let opts = {
      format: 'jpeg',
      out_dir: "./tmp",
      out_prefix: path.basename(file,path.extname(file)),
      page: null
  }
  pdf.convert(file, opts)
      .then(res => {
          console.log('Successfully converted');
      })
      .catch(error => {
          console.error(error);
      })
  res.redirect('/');
});
 
app.listen(8080, () => console.log("Running on localhost:8080"));
export default router;
