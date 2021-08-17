const express = require('express');
const fs = require('fs');
const cors = require('cors');
const session= require("express-session");
const videos = require('./assets/video-details/video-details');
const app = express();
// enable cors 
app.use(cors());
app.use(session({
    secret: 'ed0sfk3-sffbjkjf',// this secret can also be stored in an environment variable
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}))

app.get('/', (req,res)=>{
    res.status(200).send({message:'server running'})
})
 /**
 * this enpoint  will fetch rhe details of a particuar video,(NOTE: THIS IS NOT THE FILE itself, the file willl be handled later)
 */
app.get('/video/:id/data', (req, res) => {
    const id = parseInt(req.params.id, 10);
    res.json(videos[id]);
});
// this enpoint handles the fetching of the video file and returning it in buffers
app.get('/video/:id', (req, res) => {
    // get file path
    const path = `assets/${req.params.id}.mp4`;
    // get the information about that file
    const stat = fs.statSync(path);
    // get the file size
    const fileSize = stat.size;
    // check if the browser  has a range of byte it can accept at a time
    const range = req.headers.range;
    // specify chucksize
    const chunksize = 1000000
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = fileSize-1
        // the file system will read the video as a stream of bytes
        const file = fs.createReadStream(path,{start, end});
        file.on("error", error=>{
            console.log(error);
            res.status(500).send({error:"An error was encountered while streaming this file  "+path })
        })
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,// send the content range to the browaser header
            'Accept-Ranges': 'bytes',
            'Content-Length':chunksize,// specify content length as chucksize which is 1000000 bytes i.e 1MB
            'Content-Type': 'video/mp4',// specity the content type
        };
        // write header to response
        res.writeHead(206, head);
        // the file system will pipe the video in form of stream of bytes to the response object. 
        file.pipe(res);
    
    } 

    // In a case where the client browser does not support ranges
    else {
        const head = {
            'Content-Length': fileSize,
            'Content-Length':chunksize,// specify content length as chucksize which is 1000000 bytes i.e 1MB
            'Content-Type': 'video/mp4',
        };
        // write the header
        res.writeHead(200, head);
        // stream file
        fs.createReadStream(path).pipe(res);
    }
});


app.listen(process.env.PORT||4000, () => {
    console.log('Listening on port 4000!')
});