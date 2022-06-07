const express              = require("express");
const router               = express.Router();
const { google }           = require("googleapis");
const OAuth2               = google.auth.OAuth2;
const nodemailer           = require('nodemailer');
const Lawyer               = require("../models/lawyer");
const Client               = require("../models/client");
const Case                 = require("../models/case");
const middleware           = require("../middleware/index");



//Getting case from client and Storing Case in Case DB
router.post("/lawyers/:id", middleware.isClientLoggedin, (req, res) => {
    Lawyer.findById(req.params.id, (err, lawyer) => {
        if(err)
        {
            console.log(err);
            res.redirect("/lawyers");
        }
        else
        {  
            var newCase = new Case({
                caseType: req.body.caseType,
                city: req.body.city,
                description: req.body.description,
                name: req.body.name,
                lawyerName: req.body.lawyerName,
                cnic: req.body.cnic,
                mail: req.body.mail,
                phone: req.body.phone,
                date: req.body.date,
                time: req.body.time,
                status: "Waiting",
                hearing: 0,
                nextDate: "0/0/0",
                message: "Nothing"
            });

            Case.create(newCase, (err, caseResent) => {
                if(err)
                {
                    console.log(err);
                }
                else
                {
                    //adding Id and name of currentUser to Case
                    caseResent.clients = req.user;
                   // caseResent.client.cname = req.user.cname;
                    caseResent.save();
                    //Push newCase to cases in Lawyer DB
                    lawyer.cases.push(caseResent);
                    lawyer.save();
                    res.redirect("/client-dashboard")

                    //Sending Email to client
                    const Clienttransporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            type: "OAuth2",
                            user: "nodejsa@gmail.com",
                            clientId: "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
                            clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
                            refreshToken: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w"
                        },
                    });

                    const ClientmailOptions = {
                        from: '"Trust Lawyer" <nodejsa@gmail.com>', // sender address
                        to: caseResent.mail, // list of receivers
                        subject: "Trust Lawyer (New Case Added Info)", // Subject line
                        html: `
                        <h3>Hi ${caseResent.name}</h3>
                        <h4>Thank You For Hireing Our Lawyer</h4>
                        <p>1. Wait untill our Lawyer read and Accept your case</p> 
                        <p>2. You'll also be notified each Hearing Updates through Email</p> 
                        <p>3. You'll also be notified either your case is Accepted or Declined</p>
                        `,
                    };

                    Clienttransporter.sendMail(ClientmailOptions, (error, info) => {
                        if (error) {
                            console.log(error);
                           console.log("Something went wrong on our end. Please try again later.");
                        }
                        else {
                            console.log('Mail sent : %s', info.response);
                        }
                    });

                    //Sending Email to Lawyer
                    const Lawyertransporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            type: "OAuth2",
                            user: "nodejsa@gmail.com",
                            clientId: "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
                            clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
                            refreshToken: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w"
                        },
                    });

                    const LawyermailOptions = {
                        from: '"Trust Lawyer" <nodejsa@gmail.com>', // sender address
                        to: lawyer.username, // list of receivers
                        subject: "Trust Lawyer (New Case Added Info)", // Subject line
                        html: `
                        <h3>Hi ${lawyer.name}</h3>
                        <h4>A New Case Received</h4>
                        <p><b>Details:</b></p>
                        <p>City: ${caseResent.city}</p>
                        <p>Case Type: ${caseResent.caseType}</p>
                        <p>Client Email: ${caseResent.mail}</p>
                        <p>Client Phone: ${caseResent.phone}</p>
                                            
                        <p>Please Read and Accept the case as Client is on Waiting...</p>
                        `,
                    };

                    Lawyertransporter.sendMail(LawyermailOptions, (error, info) => {
                        if (error) {
                            console.log(error);
                           console.log("Something went wrong on our end. Please try again later.");
                        }
                        else {
                            console.log('Mail sent : %s', info.response);
                        }
                    });
                }
            });
        }
    });
});


//LAWYER --> CASE MANAGEMENT
//View Details - View details of a single Case by Lawyer
router.get("/dashboard/:caseid/details", middleware.isLawyerLoggedin, (req, res) => {
    Case.findById(req.params.caseid, (err, foundCase) => {
        if(err)
        {
            res.redirect("/dashboard");
        }
        else
        {
            res.render("lawyerCasedetails",  {casef: foundCase});
        }
    });
});

//Edit Case - Edit Case Status by Lawyer
router.get("/dashboard/:caseid/edit", middleware.isLawyerLoggedin, (req, res) => {
    Case.findById(req.params.caseid, (err, foundCase) => {
        res.render("lawyerCaseEdit",  {casef: foundCase});
    });
});

//Update Case - Update Case Status by Lawyer
router.put("/dashboard/:caseid", middleware.isLawyerLoggedin, (req, res) => {
    Case.findByIdAndUpdate(req.params.caseid, req.body.data, (err, updatedCase) => {
        if(err)
        {
            res.redirect("/dashboard");
        }
        else
        {
            req.flash("success", "Case Updated Successfully!");
            res.redirect("/dashboard");
        }
    });

    Case.findById(req.params.caseid, (err, caseOne) => {
        if(err)
        {
            console.log(err);
        }
        else
        {
            //Sending Email
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: "OAuth2",
                    user: "nodejsa@gmail.com",
                    clientId: "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
                    clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
                    refreshToken: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w"
                },
            });

            const mailOptions = {
                from: '"Trust Lawyer" <nodejsa@gmail.com>', // sender address
                to: caseOne.mail, // list of receivers
                subject: "Trust Lawyer (Updated Case Info)", // Subject line
                html: `
                <h3>Hi ${caseOne.name}</h3>
                <h4>Your Case is updated by Our Lawyer</h4>
                <p><b>Details:</b></p>
                <p>Case Status:  ${caseOne.status}</p> 
                <p>Lawyer Name:  ${caseOne.lawyerName}</p> 
                <p>Total Hearing:  ${caseOne.hearing}</p>
                <p>Next Hearing Date:  ${caseOne.nextDate}</p>
                <p>Lawyer Message:  ${caseOne.message}</p>
                `,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                   console.log("Something went wrong on our end. Please try again later.");
                }
                else {
                    console.log('Mail sent : %s', info.response);
                }
            });
        }
    });
});


//CLIENT --> CASE MANAGEMENT
//View Details - View details of a single Case by Client
router.get("/client-dashboard/:caseid/details", middleware.isClientLoggedin, (req, res) => {
    Case.findById(req.params.caseid, (err, foundCase) => {
        if(err)
        {
            res.redirect("/client-dashboard");
        }
        else
        {
            res.render("clientCaseDetails",  {casef: foundCase});
        }
    });
});

//View Hearings - View Hearings of a single Case by Client
router.get("/client-dashboard/:caseid/hearings", middleware.isClientLoggedin, (req, res) => {
    Case.findById(req.params.caseid, (err, foundCase) => {
        if(err)
        {
            res.redirect("/client-dashboard");
        }
        else
        {
            res.render("clientHearingsDetails",  {casef: foundCase});
        }
    });
});

//Edit Case - Edit Case by Client
router.get("/client-dashboard/:caseid/edit", middleware.isClientLoggedin, (req, res) => {
    Case.findById(req.params.caseid, (err, foundCase) => {
        res.render("clientCaseEdit",  {casef: foundCase});
    });
});

//Update Case - Update Case by Client
router.put("/client-dashboard/:caseid", middleware.isClientLoggedin, (req, res) => {
    Case.findByIdAndUpdate(req.params.caseid, req.body.data, (err, updatedCase) => {
        if(err)
        {
            res.redirect("/client-dashboard");
        }
        else
        {
            req.flash("success", "Case Updated Successfully!");
            res.redirect("/client-dashboard");
        }
    });
});


//Delete - Delete any Case by Client
router.delete("/client-dashboard/:caseid", middleware.isClientLoggedin, (req, res) => {
    Case.findByIdAndRemove(req.params.caseid, (err, deadCase) => {
        if(err)
        {
           res.redirect("back");
        }
        else
        {
            req.flash("success", "Case Deleted Successfully!");
            res.redirect("/client-dashboard");
        }
    });
});




module.exports = router;