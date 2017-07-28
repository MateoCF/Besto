var express = require('express');
var router = express.Router();
var Quiz = require('../models/quiz');
var xssFilters = require('xss-filters');

// xssFilters.inHTMLData(firstname)

//Show page to give username
router.get('/', function(req, res, next) {
  res.render('signup');
});

//Redirect username to...
router.post('/quizmaker', function(req, res, next) {
    res.redirect('/quizmaker/' + req.body.username);
});

//...let the user fill out a form that will eventually...
router.get('/quizmaker/:username', function(req, res, next){
    var paramUsername = xssFilters.inHTMLData(req.params.username);
    Quiz.count({ "username": paramUsername, "isKey": true}, function(err, numOfKeys) {
        if(err) { 
            res.send('Illegal Request', 400);
        }
        console.log(numOfKeys);
        if (numOfKeys == 0) {
            res.render('quizmaker', { username: paramUsername, error: '' });
        } else {
            res.redirect('/entries/' + paramUsername);
        }
    });
});

function isEmpty(variable) {
    if (variable == "" || null || undefined) {
        return true;
    }
    else {
        return false;
    }
}

//...check to see errors (and might redirect) but eventually...
router.post('/quizmaker/:username', function(req, res, next){
    var paramUsername = xssFilters.inHTMLData(req.params.username);
    var pendingQuizAnswer =
        new Quiz({
            username: paramUsername,
            color: xssFilters.inHTMLData(req.body.color),
            currentage: xssFilters.inHTMLData(req.body.currentage),
            crush: xssFilters.inHTMLData(req.body.crush),
            movie: xssFilters.inHTMLData(req.body.movie),
            pet: xssFilters.inHTMLData(req.body.pet),
            snack: xssFilters.inHTMLData(req.body.snack),
            enemy: xssFilters.inHTMLData(req.body.enemy),
            favsong: xssFilters.inHTMLData(req.body.favsong),
            sadsong: xssFilters.inHTMLData(req.body.sadsong),
            message: xssFilters.inHTMLData(req.body.message),
            isKey: true
        });
    if (isEmpty(pendingQuizAnswer.username) ||
        isEmpty(pendingQuizAnswer.color) ||
        isEmpty(pendingQuizAnswer.currentage) ||
        isEmpty(pendingQuizAnswer.crush) ||
        isEmpty(pendingQuizAnswer.movie) ||
        isEmpty(pendingQuizAnswer.pet) ||
        isEmpty(pendingQuizAnswer.snack) ||
        isEmpty(pendingQuizAnswer.enemy) ||
        isEmpty(pendingQuizAnswer.favsong) ||
        isEmpty(pendingQuizAnswer.sadgong)) {
        res.render('quizmaker', {
            "username": paramUsername,
            "error": 'Hey! You might want to fill out all inputs!'
        });
    }
    else {
        pendingQuizAnswer.save(function(err, quizAnswer) {
            if (err) {
                res.render('quizmaker', {
                    "username": paramUsername,
                    "error": 'Database Error/Illegal Request.',
                });
            }
            else {
                res.redirect('/entries/' + paramUsername);
            }
        });
    }
});

//...let them go to their 'dashboard' and see other people's entries.
router.get('/entries/:username', function(req, res, next) {
    var paramUsername = xssFilters.inHTMLData(req.params.username);
    Quiz.find({ "username": paramUsername, "isKey": false }, function(err, entries){
        if (err) {
            res.send('Illegal Request', 400);
        }
        else {
            Quiz.find({"username": paramUsername, "isKey": true}, function(err, setting){
                res.render('quizentries', {
                    "username": paramUsername,
                    "entries": entries,
                    "currentSetting": setting 
                });
            });
        }
    });
});

//Here is where people take the user's quiz 
router.get('/:username', function(req, res, next) {
   var paramUsername = xssFilters.inHTMLData(req.params.username);
   res.render('quiztotake', { "username": paramUsername, "error": ''}); 
});

//Here is when a user makes a mistake filling out the form
router.get('/:username/error', function(req, res, next) {
   var paramUsername = xssFilters.inHTMLData(req.params.username);
   res.render('quiztotake', { "username": paramUsername, "error": 'Hey! You might want to fill out all the forms!'}); 
});

router.post('/:username/results', function(req, res, next) {
   var paramUsername = xssFilters.inHTMLData(req.params.username);
    var pendingQuizAnswer =
        new Quiz({
            username: paramUsername,
            color: xssFilters.inHTMLData(req.body.color),
            currentage: xssFilters.inHTMLData(req.body.currentage),
            crush: xssFilters.inHTMLData(req.body.crush),
            movie: xssFilters.inHTMLData(req.body.movie),
            pet: xssFilters.inHTMLData(req.body.pet),
            snack: xssFilters.inHTMLData(req.body.snack),
            enemy: xssFilters.inHTMLData(req.body.enemy),
            favsong: xssFilters.inHTMLData(req.body.favsong),
            sadsong: xssFilters.inHTMLData(req.body.sadsong),
            message: xssFilters.inHTMLData(req.body.message),
            isKey: false
        });
    if (isEmpty(pendingQuizAnswer.username) ||
        isEmpty(pendingQuizAnswer.color) ||
        isEmpty(pendingQuizAnswer.currentage) ||
        isEmpty(pendingQuizAnswer.crush) ||
        isEmpty(pendingQuizAnswer.movie) ||
        isEmpty(pendingQuizAnswer.pet) ||
        isEmpty(pendingQuizAnswer.snack) ||
        isEmpty(pendingQuizAnswer.enemy) ||
        isEmpty(pendingQuizAnswer.favsong) ||
        isEmpty(pendingQuizAnswer.sadgong)) {
        res.redirect('/' + paramUsername + '/error');
    } else {
        pendingQuizAnswer.save(function(err, quizAnswer) {
            if (err) {
                res.send('Illegal request. (Reported)', 400);
            }
            else {
                var answerKey = Quiz.find({ "username": paramUsername, "isKey": true });
                res.render('results', { 
                    "username": paramUsername, 
                    "results": comparingResults(answerKey, quizAnswer)
                });
            }
        });
    }
});

function comparingResults(answerKey, newAttempt) {
    var score = 100;
    for (var i in answerKey) {
        if (answerKey[i] != newAttempt[i]) {
            score -= 11;
        }
    }
    return score;
}

//Send form to edit
router.get('/quizeditor/:username', function(req, res, next) {
    var paramUsername = xssFilters.inHTMLData(req.params.username);
    Quiz.count({ "username": paramUsername, "isKey": true}, function(err, numOfKeys) {
        if(err) { 
            res.send('Illegal Request', 400);
        }
        console.log(numOfKeys);
        if (numOfKeys != 0) {
            Quiz.find({ "username": paramUsername, "isKey": true}, function(err, quiz){
                if(err) { 
                    res.send('Illegal Request', 400);
                }
                res.render('quizeditor', { 
                    username: paramUsername, 
                    color: quiz.color,
                    currentage: quiz.currentage,
                    crush: quiz.crush,
                    movie: quiz.movie,
                    pet: quiz.pet,
                    snack: quiz.snack,
                    enemy: quiz.enemy,
                    favsong: quiz.favsong,
                    sadsong: quiz.sadsong,
                    message: quiz.message,
                    error: '' 
                })
            });
        } else {
            res.redirect('/quizmaker/' + paramUsername);
        }
    });
});

//Error checking and editing stuff

module.exports = router;
