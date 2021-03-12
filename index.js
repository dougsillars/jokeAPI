const sqlite3 = require('sqlite3').verbose();

require('dotenv/config');
const express =require('express');
const app = express();
app.use(express.static('public'));
app.use(express.json());

//jokes have a uuid
var uuid = require('uuid');

const adminId = process.env.adminId;

//create sqllite connection
let db = new sqlite3.Database('jokeDB', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the joke database.');
});


app.post("/joke", (req,res) => {
  //get the joke from the admin endpoint
  var body = req.body;
  var headers = req.headers;
  console.log("body", body);
  
  
  if(headers['x-admin'] === adminId){
    console.log("headermatch");
     //ok admin matched
     //we can add a joke
    console.log(body.joke);
    var joke = body.joke;
    var punchline=body.punchline;

     if(joke && punchline) {
        //all required entries in request
        //add the joke
        res.sendStatus(200);
     }else{
        //required fields missing
        res.sendStatus(422);

     }

     
 
  }else{
    //not authenticated
    res.sendStatus(401);

  }




});




//testing on 2867
app.listen(2867, () =>
  console.log('Example app listening on port 2867!'),
);
process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err)
    // Note: after client disconnect, the subprocess will cause an Error EPIPE, which can only be caught this way.
});
