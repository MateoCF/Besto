var express = require('express');
var router = express.Router();
var Quiz = require('../models/quiz');
var xssFilters = require('xss-filters');
var stringSimilarity = require('string-similarity')

//stringSimilarity.compareTwoStrings()

// xssFilters.inHTMLData(firstname)

router.get('/a/about', function(req, res, next) {
    res.render('about');
})

router.get('/a/changelog', function(req, res, next) {
    res.render('changelog');
})

router.get('/quizmaker', function(req, res, next) {
    res.redirect('/');
})

//Show page to give username
router.get('/', function(req, res, next) {
    res.render('signup');
});

//Redirect username to...
router.post('/quizmaker', function(req, res, next) {
    res.redirect('/quizmaker/' + req.body.username);
});

//...let the user fill out a form that will eventually...
router.get('/quizmaker/:username', function(req, res, next) {
    var paramUsername = xssFilters.inHTMLData(req.params.username);
    Quiz.count({ "username": paramUsername, "isKey": true }, function(err, numOfKeys) {
        if (err) {
            res.send('Illegal Request', 400);
        }
        if (numOfKeys == 0) {
            res.render('quizmaker', { username: paramUsername, error: '' });
        }
        else {
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

function comparingResults(answerKey, newAttempt) {
    var score = 100;
    if (stringSimilarity.compareTwoStrings(newAttempt.color.trim().toLowerCase(), answerKey.color.trim().toLowerCase()) < .8) { score -= 11 }
    if (newAttempt.currentage != answerKey.currentage) { score -= 11 } //NUMBER
    if (stringSimilarity.compareTwoStrings(newAttempt.crush.trim().toLowerCase(), answerKey.crush.trim().toLowerCase()) < .8) { score -= 11 }
    if (stringSimilarity.compareTwoStrings(newAttempt.movie.trim().toLowerCase(), answerKey.movie.trim().toLowerCase()) < .8) { score -= 11 }
    if (newAttempt.pet != answerKey.pet) { score -= 11 } //NUMBER
    if (stringSimilarity.compareTwoStrings(newAttempt.snack.trim().toLowerCase(), answerKey.snack.trim().toLowerCase()) < .8) { score -= 11 }
    if (stringSimilarity.compareTwoStrings(newAttempt.enemy.trim().toLowerCase(), answerKey.enemy.trim().toLowerCase()) < .8) { score -= 11 }
    if (stringSimilarity.compareTwoStrings(newAttempt.favsong.trim().toLowerCase(), answerKey.favsong.trim().toLowerCase()) < .8) { score -= 11 }
    if (stringSimilarity.compareTwoStrings(newAttempt.sadsong.trim().toLowerCase(), answerKey.sadsong.trim().toLowerCase()) < .8) { score -= 11 }
    return score;
}

//...check to see errors (and might redirect) but eventually...
router.post('/quizmaker/:username', function(req, res, next) {
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
        isEmpty(pendingQuizAnswer.message) ||
        isEmpty(pendingQuizAnswer.sadsong)) {
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
    Quiz.find({ "username": paramUsername, "isKey": true }, function(err, setting) {
        if (err) {
            res.send('Illegal Request. Reported', 400);
        }
        if (setting.length >= 1) {
            Quiz.find({ "username": paramUsername, "isKey": false }, function(err, entries) {
                if (err) {
                    res.send('Illegal request. Reported.', 400);
                    console.log(err);
                }
                if (entries.length > 0) {
                    var scores = [];
                    for (var i = 0; i < entries.length; i++) {
                        scores.push(comparingResults(setting[0], entries[i]));
                    }
                    res.render('quizentries', {
                        "username": paramUsername,
                        "entries": entries,
                        "currentSetting": setting,
                        "scores": scores,
                    });
                }
                else {
                    res.render('quizentries', {
                        "username": paramUsername,
                        "entries": "[]",
                        "currentSetting": setting,
                        "scores": []
                    });
                }
            });
        }
        else {
            res.redirect('/quizmaker/' + paramUsername);
        }
    });
});

//Here is where people take the user's quiz 
router.get('/:username', function(req, res, next) {
    var paramUsername = xssFilters.inHTMLData(req.params.username);
    Quiz.findOne({ "username": paramUsername, "isKey": true }, function(err, foundquiz) {
        if (err) {
            res.send('Illegal request. Reported.', 400);
        }
        if (foundquiz) {
            res.render('quiztotake', { "username": paramUsername, "error": '', "message": foundquiz.message });
        }
        else {
            res.redirect('/quizmaker/' + paramUsername);
        }
    })
});

//Here is when a user makes a mistake filling out the form
router.get('/:username/error', function(req, res, next) {
    var paramUsername = xssFilters.inHTMLData(req.params.username);
    Quiz.findOne({ "username": paramUsername, "isKey": true }, function(err, foundquiz) {
        if (err) {
            res.send('Illegal request. Reported.', 400);
        }
        if (foundquiz) {
            res.render('quiztotake', { "username": paramUsername, "error": 'Hey! You might want to fill out all inputs!', "message": foundquiz.message });
        }
        else {
            res.redirect('/quizmaker/' + paramUsername);
        }
    })
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
        isEmpty(pendingQuizAnswer.sadsong)) {
        res.redirect('/' + paramUsername + '/error');
    }
    else {
        pendingQuizAnswer.save(function(err, quizAnswer) {
            if (err) {
                res.send('Illegal request. Reported.', 400);
            }
            else {
                Quiz.findOne({ "username": paramUsername, "isKey": true }, function(err, foundKey) {
                    if (err) {
                        res.send('Illegal request. Reported.', 400);
                    }
                    if (foundKey == null) {
                        res.render('simpleerror', { "error": "No user exists under that name", "desc": '' })
                    }
                    else {
                        res.render('results', {
                            "username": paramUsername,
                            "results": comparingResults(foundKey, quizAnswer)
                        });
                    }
                });
            }
        });
    }
});

//Send form to edit
router.get('/quizeditor/:username', function(req, res, next) {
    var paramUsername = xssFilters.inHTMLData(req.params.username);
    Quiz.count({ "username": paramUsername, "isKey": true }, function(err, numOfKeys) {
        if (err) {
            res.send('Illegal Request', 400);
        }
        if (numOfKeys != 0) {
            Quiz.findOne({ "username": paramUsername, "isKey": true }, function(err, foundquiz) {
                if (err) {
                    res.send('Illegal Request', 400);
                }
                res.render('quizeditor', {
                    "username": paramUsername,
                    color: foundquiz.color,
                    currentage: foundquiz.currentage,
                    crush: foundquiz.crush,
                    movie: foundquiz.movie,
                    pet: foundquiz.pet,
                    snack: foundquiz.snack,
                    enemy: foundquiz.enemy,
                    favsong: foundquiz.favsong,
                    sadsong: foundquiz.sadsong,
                    message: foundquiz.message,
                    error: ''
                })
            });
        }
        else {
            res.redirect('/quizmaker/' + paramUsername);
        }
    });
});

//Error checking and editing stuff
router.post('/quizeditor/:username', function(req, res, next) {
    var paramUsername = xssFilters.inHTMLData(req.params.username);
    var pendingQuizEdit = {
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
    };
    if (isEmpty(pendingQuizEdit.username) ||
        isEmpty(pendingQuizEdit.color) ||
        isEmpty(pendingQuizEdit.currentage) ||
        isEmpty(pendingQuizEdit.crush) ||
        isEmpty(pendingQuizEdit.movie) ||
        isEmpty(pendingQuizEdit.pet) ||
        isEmpty(pendingQuizEdit.snack) ||
        isEmpty(pendingQuizEdit.enemy) ||
        isEmpty(pendingQuizEdit.favsong) ||
        isEmpty(pendingQuizEdit.sadsong)) {
        Quiz.findOne({ "username": paramUsername, "isKey": true }, function(err, quiz) {
            if (err) {
                res.send('Illegal Request', 400);
            }
            else {
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
            }
        });
    }
    else {
        Quiz.findOneAndUpdate({ "username": paramUsername, "isKey": true }, {
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
        }, function(err, update) {
            if (err) {
                res.send('Illegal Request. Reported.', 400);
            }
            else {
                res.redirect('/entries/' + paramUsername);
            }
        });
    }
});

module.exports = router;
