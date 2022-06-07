const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");


let LawyerSchema = new mongoose.Schema({
    name: String,
    city: String,
    address: String,
    phone: Number,
    username: {
        type:String,
        unique:true
    },
    password: String,
    special: String,
    experience: String,
    license: String,
    cnic: Number,
    date: String,
    file1: String,
    file2: String,
    cases: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Case"
        }
    ]
});

LawyerSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Lawyer", LawyerSchema);