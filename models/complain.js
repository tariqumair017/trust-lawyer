const mongoose = require("mongoose");

let ComplainSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: Number,
    date: String,
    time: String,
    message: String
});


module.exports = mongoose.model("Complain", ComplainSchema);