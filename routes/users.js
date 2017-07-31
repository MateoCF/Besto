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
    if (variable === "" || null || undefined) {
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
        if(entries.length != 0) {
            if (err) {
                res.send('Illegal Request', 400);
            }
            else {
                Quiz.find({"username": paramUsername, "isKey": true}, function(err, setting){
                    if (err) {
                        res.send('Illegal request. (Reported)', 400);
                    }
                    res.render('quizentries', {
                        "username": paramUsername,
                        "entries": entries,
                        "currentSetting": setting 
                    });
                });
            }
        } else {
            res.redirect('/quizmaker/' + paramUsername);
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
   res.render('quiztotake', { "username": paramUsername, "error": 'Hey! You might want to fill out all inputs!'}); 
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
                Quiz.findOne({ "username": paramUsername, "isKey": true }, function(err, foundKey){
                    if (err) {
                        res.send('Illegal request. (Reported)', 400);
                    }
                    res.render('results', { 
                        "username": paramUsername, 
                        "results": comparingResults(foundKey, quizAnswer)
                    });
                });
            }
        });
    }
});

function comparingResults(answerKey, newAttempt) {
    var score = 100;
    if (newAttempt.color != answerKey.color) { score -= 11 }
    if (newAttempt.currentage != answerKey.currentage) { score -= 11 }
    if (newAttempt.crush != answerKey.crush) { score -= 11 }
    if (newAttempt.movie != answerKey.movie) { score -= 11 }
    if (newAttempt.pet != answerKey.pet) { score -= 11 }
    if (newAttempt.snack != answerKey.snack) { score -= 11 }
    if (newAttempt.enemy != answerKey.enemy) { score -= 11 }
    if (newAttempt.favsong != answerKey.favsong) { score -= 11 }
    if (newAttempt.sadsong != answerKey.sadsong) { score -= 11 }
    console.log(newAttempt.sadsong + answerKey.sadsong);
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
            Quiz.find({ "username": paramUsername, "isKey": true}, function(err, foundquiz){
                if(err) { 
                    res.send('Illegal Request', 400);
                }
                console.log(foundquiz);
                res.render('quizeditor', { 
                    "username": paramUsername, 
                    color: foundquiz[0].color,
                    currentage: foundquiz[0].currentage,
                    crush: foundquiz[0].crush,
                    movie: foundquiz[0].movie,
                    pet: foundquiz[0].pet,
                    snack: foundquiz[0].snack,
                    enemy: foundquiz[0].enemy,
                    favsong: foundquiz[0].favsong,
                    sadsong: foundquiz[0].sadsong,
                    message: foundquiz[0].message,
                    error: '' 
                })
            });
        } else {
            res.redirect('/quizmaker/' + paramUsername);
        }
    });
});

//Error checking and editing stuff
router.post('/quizeditor/:username', function(req, res, next) {
   var paramUsername = xssFilters.inHTMLData(req.params.username);
    var pendingQuizEdit =
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
    if (isEmpty(pendingQuizEdit.username) ||
        isEmpty(pendingQuizEdit.color) ||
        isEmpty(pendingQuizEdit.currentage) ||
        isEmpty(pendingQuizEdit.crush) ||
        isEmpty(pendingQuizEdit.movie) ||
        isEmpty(pendingQuizEdit.pet) ||
        isEmpty(pendingQuizEdit.snack) ||
        isEmpty(pendingQuizEdit.enemy) ||
        isEmpty(pendingQuizEdit.favsong) ||
        isEmpty(pendingQuizEdit.sadgong)) {
        Quiz.find({ "username": paramUsername, "isKey": true}, function(err, quiz){
            if(err) { 
                res.send('Illegal Request', 400);
            } else {
                res.render('quizeditor', 
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
                        error: 'Hey! You might want to fill out all inputs!' 
                    })
                );
            }
        });
    } else {
        Quiz.findOneAndUpdate({ "username": paramUsername, "isKey": true}, {
            color: xssFilters.inHTMLData(req.body.color),
            currentage: xssFilters.inHTMLData(req.body.currentage),
            crush: xssFilters.inHTMLData(req.body.crush),
            movie: xssFilters.inHTMLData(req.body.movie),
            pet: xssFilters.inHTMLData(req.body.pet),
            snack: xssFilters.inHTMLData(req.body.snack),
            enemy: xssFilters.inHTMLData(req.body.enemy),
            favsong: xssFilters.inHTMLData(req.body.favsong),
            sadsong: xssFilters.inHTMLData(req.body.sadsong),
            message: xssFilters.inHTMLData(req.body.message)
        }, function(err, update){
            if (err) {
                res.send('Illegal Request. Reported.', 400);
            } else {
                res.redirect('/entries/' + paramUsername);
            }
        });
    }
});
module.exports = router;
