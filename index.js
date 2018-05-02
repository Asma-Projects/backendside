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
const multer = require('multer');
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

 // Create storage engine
 const storage = new GridFsStorage({
   url: mongoURI,
   
   file: (req, file) => {
    filepath: file.path 
     return new Promise((resolve, reject) => {
       crypto.randomBytes(16, (err, buf) => {
         if (err) {
           return reject(err);
         }
         const filename = file.originalname ;
         const filepath = file.path ;
         const fileInfo = {
           filename: filename,
           filepath: filepath ,
           bucketName: 'uploads'
         };
         resolve(fileInfo);
       });
     });
   }
 });
 const upload = multer({ storage : storage });


 // @route GET /
 // @desc Loads form
 app.get('/', (req, res) => {
   gfs.files.find().toArray((err, files) => {
     // Check if files
     if (!files || files.length === 0) {
       res.render('index', { files: false });
     } else {
       files.map(file => {
         if (
           file.contentType === 'image/jpeg' ||
           file.contentType === 'image/png'
         ) {
           file.isImage = true;
         } else {
           file.isImage = false;
         }
       });
       res.render('index', { files: files });
     }
   });
 });

 // @route POST /upload
 // @desc  Uploads file to DB
 app.post('/upload', upload.single('file'), (req, res) => {
   console.log('file uploaded successfully');
   console.log(req.file.path);
   res.redirect('/');
 });
 app.post('/convert',  upload.single('file'),(req, res) =>{
// let file ='./cont.pdf'
  // let file =  '/uploads/' + req.file.originalname ;
    let fil = req.file.path;
  // let file= mongoURI+'/uploads.files/' + req.file.originalname
   console.log(fil)
  // let opts = {
  //     format: 'jpeg',
  //     out_dir: "./tmp",
  //     out_prefix: path.basename(file,path.extname(file)),
  //     page: null
  // }
  // pdf.convert(file, opts)
  //     .then(res => {
  //         console.log('Successfully converted');
  //     })
  //     .catch(error => {
  //         console.error(error);
  //     })
  res.redirect('/');
});
 // @route GET /files
 // @desc  Display all files in JSON
 app.get('/files', (req, res) => {
   gfs.files.find().toArray((err, files) => {
     // Check if files
     if (!files || files.length === 0) {
       return res.status(404).json({
         err: 'No files exist'
       });
     }

     // Files exist
     return res.json(files);
   });
 });

 // @route GET /files/:filename
 // @desc  Display single file object
 app.get('/files/:filename', (req, res) => {
   gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
     // Check if file
     if (!file || file.length === 0) {
       return res.status(404).json({
         err: 'No file exists'
       });
     }
     // File exists
     return res.json(file);
   });
 });

 // @route GET /image/:filename
 // @desc Display Image
 app.get('/image/:filename', (req, res) => {
   gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
     // Check if file
     if (!file || file.length === 0) {
       return res.status(404).json({
         err: 'No file exists'
       });
     }

     // Check if image
     if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
       // Read output to browser
       const readstream = gfs.createReadStream(file.filename);
       readstream.pipe(res);
     } else {
       res.status(404).json({
         err: 'Not an image'
       });
     }
   });
 });

 // @route DELETE /files/:id
 // @desc  Delete file
 app.delete('/files/:id', (req, res) => {
   gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
     if (err) {
       return res.status(404).json({ err: err });
     }

     res.redirect('/');
   });
 });

app.listen(8080, () => console.log("Running on localhost:8080"));
export default router;
