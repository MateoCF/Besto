var mongoose = require('mongoose');
var quizSchema = mongoose.Schema({
    //Username for person filling out answer key and person filling out the questionaire. Dual Purpose 
    username: String,
    color: String,
    currentage: Number,
    crush: String,
    movie: String,
    pet: Number,
    snack: String,
    enemy: String,
    favsong: String,
    sadsong: String,
    
    //For Person Filling Out survey they can leave an optional message. 
    message: String,
    
    //If this is answer key or entry. 
    isKey: Boolean
});

var Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;