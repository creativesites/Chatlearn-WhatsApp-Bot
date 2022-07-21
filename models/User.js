const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
    name:{
        type: String,
        unique: false,
    },
    number:{
        type: String,
        unique: true,
    },
    form:{
        type: String,
        unique: false,
        required: false
    },
    school:{
        type: String,
        unique: false,
    },
    
    location:{
        type: String
    },
    topicsDone:{ type : Array , "default" : [] },
    currentTopic:{
        type: String
    },
    testsDone:{ type : Array , "default" : [] },
    excircesDone:{ type : Array , "default" : [] },
    avarageScore:{
        type: Number
    },
    reccomendedTopics:{ type : Array , "default" : [] },
    registered: {
        type: Boolean,
        default: false
    }
});

const User = mongoose.model('user', UserSchema);
module.exports = User;