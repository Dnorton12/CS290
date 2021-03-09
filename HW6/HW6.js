var express = require('express');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout: 'main'});
var session = require('express-session');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 7499);

var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit  :  10,
	host             : 'classmysql.engr.oregonstate.edu',
	user  			 : '[cs290_nortond]',
	password		 : '[0158]',
	database		 : '[cs290_nortond]'
});

//From class
app.get('/reset-table',function(req,res,next){
	var context = {};
	pool.query("DROP TABLE IF EXISTS workouts", function(err){
		var createString = "CREATE TABLE workouts(" +
		"id INT PRIMARY KEY AUTO_INCREMENT," +
		"name VARCHAR(255) NOT NULL," +
		"reps INT," +
		"weight INT," +
		"date Date," +
		"lbs Boolean)";
		pool.query(createString, function(err){
			context.results = "Table reset";
			res.render('home',context);
		})
	});
});

app.get('/', function(req, res, next){
	var context = {};
	pool.query('SELCT * FROM workouts', function(err, rows, fields){
		if(err){
			next(err);
			return;
		}
		context.results = JSON.stringify(rows);
		res.render('home', context);
	});
});

app.get('/insert',function(req, res, next){
	var context = {};
	pool.query("INSERT INTO workouts (`name`, `reps`, `weight`, `date`, `lbs`) VALUES (?,?,?,?,?)", [req.query.name, req.query.reps, req.query.weight, req.query.date, req.query.lbs], function(err, result){
		if(err){
			next(err);
			return;
		}
		context.results = "Inserted id " + results.insertId;
		res.render('home', context);
	});
});

app.get('/delete', function(req, res, next){
	var context = {};
	pool.query('DELETE FROM workouts WHERE id=?', [req.query.id], function(err, result){
		if(err){
			next(err);
			return;
		}
		context.results = "Deleted " + result.insertId + " rows.";
        res.send(context);
	});
});

app.get('/safe-update',function(req, res, next){
	var context = {};
	pool.query("SELECT * FROM workouts WHERE id=?", [req.query.id], function(err, result){
		if(err){
			next(err);
			return;
		}
		if(result.length == 1){
			var curVals = result[0];
			pool.query("UPDATE workouts SET name=?, reps=?, weight=?, date=?, lbs=? WHERE id=? ",
				[req.query.name || curVals.name, req.query.reps || curVals.reps, req.query.weight || curVals.weight, req.query.date || curVals.date, req.query.lbs || curVals.lbs, req.query.id],
				function(err, result){
				if(err){
					next(err);
					return;
				}
				context.results = "Updated " + result.changedRows + " rows.";
				res.render('home',context);
			});
		}
	});
});

app.use(function(req, res){
	res.status(404);
	res.render('404');
});

app.use(function(err, req, res, next){
	console.log(err.stack);
	res.type('plain/text');
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
	console.log('Express started on https://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
