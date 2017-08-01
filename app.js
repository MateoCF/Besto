var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var helmet = require('helmet')
var xssFilters = require('xss-filters');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/besto').catch(err => console.error(err));;
mongoose.connection.on('open', function () {  
  console.log("Mongoose open event"); 
});
mongoose.connection.on('close', function () {  
  console.log("Mongoose close event"); 
});
mongoose.connection.on('connected', function () {  
  console.log("Mongoose connected event");
}); 
mongoose.connection.on('disconnected', function () {  
  console.log("Mongoose disconnected event"); 
});
mongoose.connection.on('error',function (err) {  
  console.log("Mongoose error event:");
  console.log(err)
}); 

//mongod --bind_ip=$IP --nojournal

var users = require('./routes/users');

var app = express();

app.use(helmet());
app.use(helmet.noCache());
app.use(helmet.frameguard());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
