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
  db.all(dbcountQuery, [], (err, count) => {
    dbcounter = count[0]['COUNT(*)'];
    console.log(dbcounter);
  });

});


app.post("/joke", (req, res) => {
  //get the joke from the admin endpoint
  var body = req.body;
  var headers = req.headers;
  console.log("body", body);
  if (headers['x-admin'] === adminId) {
    console.log("headermatch");
    //ok admin matched
    //we can add a joke
    console.log(body.joke);
    var joke = body.joke;
    var punchline=body.punchline;
    var category = body.category;

    if (joke && punchline) {
      //all required entries in request
      //add the joke
      var currentTime = Date.now();
      dbcounter++;
      db.run(
        'INSERT INTO jokes(id, joke, punchline, category, createdAt, thumbsUp, thumbsDown) VALUES(?, ?,?,?,?,?,?)',
        [dbcounter, joke, punchline, category, currentTime, 0, 0],
        (err) => {
          if(err) {
            return console.log(err.message);
          }
          console.log('Row was added to the table: ${this.lastID}');
          console.log("counter", dbcounter);
        }
      );
      res.sendStatus(200);
    } else {
      //required fields missing
      res.sendStatus(422);
    }
  } else {
    //not authenticated
    res.sendStatus(401);
  }
});


//retrieve jokes from the DB
app.get("/joke", (req, res) => {
  var category = req.query.category;
  var jokeQuery = 'SELECT id, joke, punchline, thumbsUp, thumbsDown, category, createdAt FROM jokes';
  var params = [];
  if (category !== undefined) {
    // pull category
    jokeQuery += ' WHERE category=?';
    params.push(category);
  }
  // Pick a random joke
  jokeQuery += ' ORDER BY RANDOM() LIMIT 1';
  console.log("jokeQuery", jokeQuery);
  db.all(jokeQuery, params, (err, rows) => {
    if (rows.length === 0) {
      res.sendStatus(404);
    } else {
      var joke = rows[0];
      console.log("random joke", joke.joke);
      console.log("random punchline", joke.punchline);
      var jokeToReturn = {
        id: joke.id,
        dateAdded: joke.createdAt,
        joke: joke.joke,
        punchline:joke.punchline,
        thumbsUp:joke.thumbsUp,
        thumbsDown: joke.thumbsDown,
        category: joke.category
      };
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(jokeToReturn));
    }
  });
});

//thumbsup

app.post("/thumbsup", (req, res) => {
  //we just need the jokeId
  var jokeId = req.body.id;
  console.log('jokeId', jokeId);
  if (jokeId > 0) {
    //we have a JokeId
    //grab the joke from the DB
    var thumbsUpQuery = 'SELECT id, thumbsUp, createdAt from jokes WHERE id=?';

    db.all(thumbsUpQuery, [jokeId], (err, rows) =>{
      if (rows.length === 0) {
        res.sendStatus(404);
      } else {
        var thumbsUp = rows[0]['thumbsUp'];
        console.log('thumbsUp', thumbsUp);
        thumbsUp++;
        let thumbsUpdata = [thumbsUp, jokeId];
        let sql = 'UPDATE jokes SET thumbsUp=? WHERE id= ?';
        db.run(sql, thumbsUpdata, (err) => {
          if (err) {
            res.sendStatus(400);
            return console.error(err.message);
          }
          console.log(`Row(s) updated: ${this.changes}`);
          res.sendStatus(200);
        });
      }
    });
  }else{
    //required fields missing
    res.sendStatus(422);
  }
});

//thumbsdown

app.post("/thumbsdown", (req, res) => {
  //we just need the jokeId
  var jokeId = req.body.id;
  console.log('jokeId', jokeId);
  if (jokeId > 0) {
    //we have a JokeId
    //grab the joke from the DB
    var thumbsDownQuery = 'SELECT id, thumbsDown, createdAt from jokes WHERE id=?';

    db.all(thumbsDownQuery, [jokeId], (err, rows) => {
      if (rows.length === 0) {
        res.sendStatus(400);
      } else {
        var thumbsDown = rows[0]['thumbsDown'];
        console.log('thumbsDown', thumbsDown);
        thumbsDown++;
        let thumbsDowndata = [thumbsDown, jokeId];
        let sql = 'UPDATE jokes SET thumbsDown=? WHERE id= ?';
        db.run(sql, thumbsDowndata, (err) => {
          if (err) {
            res.sendStatus(400);
            return console.error(err.message);
          }
          console.log(`Row(s) updated: ${this.changes}`);
          res.sendStatus(200);
        });
      }
    });
  } else {
    //required fields missing
    res.sendStatus(422);
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
