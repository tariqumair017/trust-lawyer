const mongoose = require("mongoose");
const LocalMongoose = require("passport-local-mongoose");


let ClientSchema = new mongoose.Schema({
    cname: String,
    ccity: String,
    caddress: String,
    cphone: Number,
    ccnic: Number,
    username: {
        type:String,
        unique:true
    },
    password: String
});

ClientSchema.plugin(LocalMongoose);
module.exports = mongoose.model("Client", ClientSchema);