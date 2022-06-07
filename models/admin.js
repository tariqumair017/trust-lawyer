const mongoose = require("mongoose");
const LMongoose = require("passport-local-mongoose");


let AdminSchema = new mongoose.Schema({
    username: {
        type:String,
        unique:true
    },
    password: String
});

AdminSchema.plugin(LMongoose);
module.exports = mongoose.model("Admin", AdminSchema);