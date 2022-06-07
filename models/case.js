const mongoose = require("mongoose");

let CaseSchema = new mongoose.Schema({
    caseType: String,
    city: String,
    description: String,
    name: String,
    lawyerName: String,
    mail: String,
    cnic: Number,
    phone: Number,
    date: String,
    time: String,
    status: String,
    hearing: Number,
    nextDate: String,
    message: String,
    clients: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client"
        }
    ]
});


module.exports = mongoose.model("Case", CaseSchema);
