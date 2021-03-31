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
  var dbcountQuery = 'SELECT COUNT(*) from jokes';
  db.all(dbcountQuery,[],(err, count) =>{
    dbcounter = count[0]['COUNT(*)'];
    console.log(dbcounter);
  })

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
    var category = body.category;

     if(joke && punchline) {
        //all required entries in request
        //add the joke
        var currentTime = Date.now();
        dbcounter++;
        db.run('INSERT INTO jokes(id, joke, punchline, category, createdAt, thumbsUp, thumbsDown) VALUES(?, ?,?,?,?,?,?)', [dbcounter,joke, punchline,category,currentTime,0,0], (err) => {
          if(err) {
            return console.log(err.message); 
          }
          console.log('Row was added to the table: ${this.lastID}');
          console.log("counter", dbcounter);
        })
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


//retrieve jokes from the DB

app.get("/joke", (req,res) => {
  var category ="";
   category = req.query.category;

  var jokeQuery = 'SELECT id, joke, punchline, thumbsUp, thumbsDown, category, createdAt from jokes WHERE category=="'+category+'"';
  if(category==null){
    //pull category
    jokeQuery = 'SELECT joke, punchline from jokes';
  }
  console.log("jokeQuery", jokeQuery);
  db.all(jokeQuery,[],(err, rows) =>{
    var numberOfRows = rows.length;
    console.log("numberOfRows", numberOfRows);
    rows.forEach((row) =>{
      console.log(row.joke + " " + row.punchline);
    });
    //now select a random joke
    var random = Math.floor(Math.random() * numberOfRows);
    console.log("random joke", rows[random].joke);
    console.log("random punchline", rows[random].punchline);
    var jokeToReturn = {
      id: rows[random].id,
      dateAdded: rows[random].createdAt,
      joke: rows[random].joke, 
      punchline:rows[random].punchline,
      thumbsUp:rows[random].thumbsUp,
      thumbsDown: rows[random].thumbsDown, 
      category: rows[random].category
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(jokeToReturn));
  });

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
