import express from "express";
import path from "path";
// import alert from 'alert-node'
const sharp = require('sharp');
var WordPOS = require('wordpos'),
    wordpos = new WordPOS();

var fs = require('fs');
const pica = require('pica')();
const pdfjsLib = require('pdfjs-dist');
var fileDownload = require('js-file-download');
import Tesseract from 'tesseract.js'
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
const getPageCount = require('docx-pdf-pagecount');


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
 var mkdirp = require('mkdirp');
    
 mkdirp('./uploads', function (err) {
     if (err) console.error(err)
     else console.log('repository uploads created!')
 });
 mkdirp('./texts', function (err) {
    if (err) console.error(err)
    else console.log('repository texts created!')
});
 mkdirp('./images', function (err) {
    if (err) console.error(err)
    else console.log('repository images created!')
});
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
    if(req.file){
    let file = req.file.path;
  let opts = {
      format: 'jpeg',
      out_dir: "./images",
      out_prefix: path.basename(file,path.extname(file)),
      page: null
  }
  fs.writeFile('./texts/' + path.basename(file,path.extname(file))+'.txt', '', function (err) {
      console.log('file created')
  })
  pdf.convert(file, opts)
      .then(res => {
          console.log('Successfully converted');
      })
      .catch(error => {
          console.error(error);
      
      }).then(function(){
    pdfjsLib.getDocument(file)
    .then(function (doc) {
        let numPages = doc.numPages;
    console.log(numPages)
    
    for(let i=1;i<numPages+1;i++){
        let newfile='./images/' + path.basename(file,path.extname(file))+'-'+ i +'.jpg'
        let newfile1='./images/' + path.basename(file,path.extname(file))+'-improved-'+ i +'.jpg'
        sharp(newfile)
        .resize(1580, 2200).gamma(3)
        .greyscale()
        .sharpen(2.0,1.0,1.0).threshold(120)
        .toFile(newfile1, function(err) {
            const Tesseract = require('tesseract.js').create({
                workerPath: path.join(__dirname, '../src/node/worker.js'),
                langPath: path.join(__dirname, '../src/langs'),
                corePath: path.join(__dirname, '../src/node/index.js')
            });
            Tesseract.recognize(newfile1).then(result => {
               
             fs.writeFile('./texts/' + path.basename(file,path.extname(file))+'-'+ i +'.txt', result.text, function (err) {
              
        fs.appendFile('./texts/' + path.basename(file,path.extname(file))+'.txt',result.text, function (err) {
            if (err) throw err;
            console.log('The "data to append" was appended to file!');
        
          });
         
                    console.log('Extracting data from image into .txt done !');
            
                })
            })
        }) ;
        
    
    }
  })
  })

  res.redirect('/');}
  else {
    console.log('there is no file to convert please upload your file')
  }
  
});
 app.post('/showfile',  function(req, res)  {
    // var o = {} // empty Object
    // var key = 'Orientation Sensor';
    // o[key] = []; // empty Array, which you can push() values into
    
    
    // var data = {
    //     sampleTime: '1450632410296',
    //     data: '76.36731:3.4651554:0.5665419'
    // };
    // var data2 = {
    //     sampleTime: '1450632410296',
    //     data: '78.15431:0.5247617:-0.20050584'
    // };
    // o[key].push(data);
    // o[key].push(data2);
    // JSON.stringify(o);
    // console.log(o)
    // var json2xls = require('json2xls');
 
    
    // var xls = json2xls(o);
    
    // fs.writeFileSync('./texts/data.xlsx', xls, 'binary');
    
//     var pdf2table = require('pdf2table');


// fs.readFile('./uploads/bulletin-de-paie-du-01042018-au-30042018.pdf', function (err, buffer) {
//     if (err) return console.log(err);

//     pdf2table.parse(buffer, function (err, rows, rowsdebug) {
//         if(err) return console.log(err);
//         console.log(rows);
//     });
// }); 
//     const fullTextSearch = require('full-text-search');
//     var search = new fullTextSearch();
//     search.add(result.text);
//     var results = search.search('p');
//    console.log(results)

    // var file_name = './texts/bulletin-de-paie-du-01042018-au-30042018.txt';

    // var readline = require('readline');

    
    // var lineReader = readline.createInterface({
    //     input: fs.createReadStream(file_name)
    // });
    
    // var isHeader = false;
    // var columnNames = [];
    
    // function parseLine(line) {
    //     return line.trim().split('\t')
    // }
    
    // function createRowObject(values) {
    //     var rowObject = {};
    
    //     columnNames.forEach((value,index) => {
    //         rowObject[value] = values[index];
    //     });
    
    //     return rowObject;
    // }
    
    // var json = {};
    // json[file_name] = [];
    
    // lineReader.on('line', function (line) {
    //     if(!isHeader) {
    //         columnNames = parseLine(line);
    //         isHeader = true;
    //     } else 
    //         json[file_name].push(createRowObject(parseLine(line)));
        
    // });
    
    // lineReader.on('close', function () {
    //     fs.writeFileSync('./texts/cont.json', JSON.stringify(json,null,2));
    // });

    // conversion JSON-> Excel possible
    var json2xls = require('json2xls');
    var json = {
        Date: '12/12/2012',
        Entreprise: 'Yves Rocher ',
        Client: 'asma khalfallah',
        Objet: 'achat d un produit cosmetique '
    }
    
    var xls = json2xls(json);
    
    fs.writeFileSync('./texts/data.xlsx', xls, 'binary');
    

//     var s = "workingtable;AB8C;book_id;7541;";
//  var parts = s.split(';');
//  var jobj = {};
//  for(let i=0;i<parts.length;i+=2)
//  {
//     jobj[parts[i]]=parts[i+1];
//  }
// console.log(JSON.stringify(jobj));
//     // fs.readFile( './texts/cont.txt', function (err, data) { 
       
    // }); 
      
   
      



res.redirect('/');
});
 
app.listen(8080, () => console.log("Running on localhost:8080"));

