const express              = require("express");
const router               = express.Router(); 
const passport             = require("passport");
const bcryptjs             = require('bcryptjs');
const bcrypt               = require('bcrypt');
const { google }           = require("googleapis");
const OAuth2               = google.auth.OAuth2;
const jwt                  = require('jsonwebtoken'); 
const JWT_RESET_KEY        = "jwtreset987";
const nodemailer           = require('nodemailer');
const Lawyer               = require("../models/lawyer");
const Client               = require("../models/client");
const Admin                = require("../models/admin");
const Complain             = require("../models/complain");
const middleware           = require("../middleware/index");




//Show Admin Sign Up form
router.get("/adminDashboardLawyer/admin-signup", middleware.isAdminLoggedin, (req, res) => {
    res.render("admin-signup");
});
//Handel Admin Sign Up Logic
router.post("/adminDashboardLawyer/admin-signup", middleware.isAdminLoggedin, (req, res) => {
     const {
        username,
        password,
        cpassword
        } = req.body;
  
      let errors = [];
  
      //------------ Checking password mismatch ------------//
      if (password != cpassword) {
        console.log("Passwords do not match");
        req.flash("error", "Passwords do not match");
        return res.redirect("/adminDashboardLawyer/admin-signup");
      }
  
      //------------ Checking password length ------------//
      if (password.length < 8) {
        console.log("Password must be at least 8 characters");
        req.flash("error", "Password must be at least 8 characters");
        return res.redirect("/adminDashboardLawyer/admin-signup");
      }

      if (errors.length > 0) {
          console.log("Error");
          return res.redirect("/adminDashboardLawyer/admin-signup");
      } else
      {
        Admin.findOne({username: username}).then((client) => {
    
          if (client) {
            console.log("matched");
            //------------ User already exists ------------//
            console.log("Username or Email ID already registered");
            req.flash("error", "Email ID already registered");
            return res.redirect("/adminDashboardLawyer/admin-signup");
          } else {
            const newAdmin = new Admin({
               username: req.body.username,
               password : req.body.password
            });
            bcryptjs.genSalt(10, (err, salt) => {
              bcryptjs.hash(newAdmin.password, salt, (err, hash) => {
                if (err) {
                  console.log(err);
                }
                newAdmin.password = hash;
                newAdmin.save().then((lawywer) => {
                    res.redirect("/adminDashboardLawyer");
                    })
                    .catch((err) => console.log(err));         
              });
            });
          }
        });
      }
});

//Show Admin Forget Password form
router.get("/adminForgot", (req, res) => {
    res.render("adminForgetPassword");
  });

//Forgot Password Handle
router.post("/adminForgot", (req, res) => {
    const email = req.body.email;
    let errors = [];
  
    //------------ Checking required fields ------------//
    if (!email) {
        req.flash("error", "Please enter an email ID");
        return res.redirect('/adminForgot');
    }
  
    if (errors.length > 0) 
    {
        return res.redirect('/adminForgot');
    } 
    else 
    {
        Admin.findOne({username: email}).then(user => {
            if (!user) {
                //------------ User already exists ------------//
                console.log('User with Email ID does not exist!');
                req.flash("error", "User with Email ID does not exist!");
                return res.redirect('/adminForgot');
            } else {
                const oauth2Client = new OAuth2(
                    "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com", // ClientID
                    "OKXIYR14wBB_zumf30EC__iJ", // Client Secret
                    "https://developers.google.com/oauthplayground" // Redirect URL
                );
  
                oauth2Client.setCredentials({
                    refresh_token: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w"
                });
                const accessToken = oauth2Client.getAccessToken()
  
                const token = jwt.sign({ _id: user._id }, JWT_RESET_KEY, { expiresIn: '30m' });
                const CLIENT_URL = 'http://' + req.headers.host;
                const output = `
                <h2>Admin Please click on below link to reset your account password</h2>
                <p>${CLIENT_URL}/adminForgot/${token}</p>
                <p><b>NOTE: </b> The activation link expires in 30 minutes.</p>
                `;
  
                Admin.updateOne({ resetLink: token }, (err, success) => {
                    if (err) {
                        req.flash("error", "Error resetting password!");
                        return res.redirect('/adminForgot');
                    }
                    else {
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                type: "OAuth2",
                                user: "nodejsa@gmail.com",
                                clientId: "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
                                clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
                                refreshToken: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w",
                                accessToken: accessToken
                            },
                        });
  
                        // send mail with defined transport object
                        const mailOptions = {
                            from: '"Trust Lawyer" <nodejsa@gmail.com>', // sender address
                            to: email, // list of receivers
                            subject: "Admin Account Password Reset: Trust Lawyer Auth ✔", // Subject line
                            html: output, // html body
                        };
  
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.log(error);
                               console.log("Something went wrong on our end. Please try again later.");
                            }
                            else {
                                console.log('Mail sent : %s', info.response);
                                console.log("Password reset link sent to email ID. Please follow the instructions.");
                                req.flash("success", "Password reset link sent to email ID. Please follow the instructions!");
                                return res.redirect('/admin-loginLawyer');
                            }
                        })
                    }
                })
  
            }
        });
    }
});

//Reset Password Handle
router.get('/adminForgot/:tookeen', (req, res) => {
    const { tookeen } = req.params;
  
    if (tookeen) {
        jwt.verify(tookeen, JWT_RESET_KEY, (err, decodedToken) => {
            if (err) {
                console.log("Incorrect or expired link! Please try again.");
                req.flash("error", "User with Email ID does not exist!");
                return res.redirect('/adminForgot');
            }
            else {
                const { _id } = decodedToken;
                Admin.findById(_id, (err, user) => {
                    if (err) {
                        console.log("User with email ID does not exist! Please try again.");
                        req.flash("error", "Please try again!");
                        return res.redirect('/admin-loginLawyer');
                    }
                    else {
                        res.redirect(`/adminReset/${_id}`)
                    }
                })
            }
        })
    }
    else {
        console.log("Password reset error!")
    }
});

//Reset Password Route
router.get("/adminReset/:ed", middleware.adminExistForReset, (req, res) => {
    // console.log(ed)
    res.render("adminResetPassword", { ed: req.params.ed })
});

//Reset Password Handle
router.post("/adminReset/:ed", middleware.adminExistForReset, (req, res) => {
    var { password, password2 } = req.body;
    const ed = req.params.ed;
    let errors = [];
  
    //------------ Checking required fields ------------//
    if (!password || !password2) {
        console.log("Please enter all fields");
        req.flash("error", "Please enter all fields!");
        return res.redirect(`/adminReset/${ed}`);
    }
  
    //------------ Checking password length ------------//
    else if (password.length < 8) {
        console.log("Password must be at least 8 characters.");
        req.flash("error", "Password must be at least 8 characters!");
        return res.redirect(`/adminReset/${ed}`);
    }
  
    //------------ Checking password mismatch ------------//
    else if (password != password2) {
        console.log("Passwords do not match.");
        req.flash("error", "Passwords do not match!");
        return res.redirect(`/adminReset/${ed}`);
    }
  
    else 
    {
        bcryptjs.genSalt(10, (err, salt) => {
            bcryptjs.hash(password, salt, (err, hash) => {
                if (err) throw err;
                password = hash;
  
                Admin.findByIdAndUpdate(
                    { _id: ed },
                    { password },
                    function (err, result) {
                        if (err) {
                            console.log("Error resetting password!");
                            req.flash("error", "Error resetting password!");
                            return res.redirect(`/adminReset/${ed}`);
                        } else {
                            console.log("Password reset successfully!");
                            req.flash("success", "Password reset successfully!");
                            return res.redirect('/admin-loginLawyer');
                        }
                    }
                );
  
            });
        });     
    }
});

//Show Admin Login form
router.get("/admin-loginLawyer", (req, res) => {
    res.render("admin-loginLawyer");
});

//Handel Admin Login Logic ("/login", middleware, callback)
router.post("/admin-loginLawyer", (req, res, next) => {
    passport.authenticate("Admin", {
      successRedirect: "/adminDashboardLawyer",
      failureRedirect: "/admin-loginLawyer",
      failureFlash: true,
    })(req, res, next);
});
//router.post("/admin-loginLawyer", (req, res) => {
//    passport.authenticate("Admin")(req, res, () => {
//        if(req.isAuthenticated()){
//            status = "admin";
//            res.redirect("/adminDashboardLawyer");
//        }
//        else
//        {
//            //req.flash("error", "Please Login First!");
//            res.redirect("/admin-loginLawyer");
//        }
//    })
//});


//Get All Lawyer
router.get("/adminDashboardLawyer", middleware.isAdminLoggedin, (req, res) => {
    Lawyer.find({}, (err, allLawyers) => {
        if(err)
        {
            console.log(err);
        }
        else
        {
            status = "admin";
            res.render("adminDashboardLawyer", {data: allLawyers});
        }
    });
});

//Filter Lawyer
router.post("/adminDashboardLawyer", middleware.isAdminLoggedin, (req, res) => {
    var filterName = req.body.name;
    var filterLicense = req.body.license;

    if(filterName !='' && filterLicense !='')
    {
        var filterParameter = { $and:[{name:filterName}, {license:filterLicense}] }
    }else if(filterName !='' && filterLicense =='')
    {
        var filterParameter = { $or:[{name:filterName}, {license:filterLicense}] }
    }else if(filterName =='' && filterLicense !='')
    {
        var filterParameter = { $or:[{name:filterName}, {license:filterLicense}] }
    }else
    {
        var filterParameter = {}
    }


    Lawyer.find(filterParameter, (err, allLawyers) => {
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("adminDashboardLawyer", {data: allLawyers});
        }
    });
});

//View Details - View details of a single Lawyer
router.get("/adminDashboardLawyer/:lawyerid/details", middleware.isAdminLoggedin, (req, res) => {
    Lawyer.findById(req.params.lawyerid, (err, foundLawyer) => {
        if(err)
        {
            res.redirect("/adminDashboardLawyer");
        }
        else
        {
            res.render("adminSingleLawyer",  {lawyer: foundLawyer});
        }
    });
});

//Delete - Delete Lawyer
router.delete("/adminDashboardLawyer/:lawyerid", middleware.isAdminLoggedin, (req, res) => {
    Lawyer.findByIdAndRemove(req.params.lawyerid, (err, deadLawyer) => {
        if(err)
        {
            res.redirect("back");
        }
        else
        {
            req.flash("success", "Lawyer Deleted!");
            res.redirect("/adminDashboardLawyer");

            //Sending Email
            const transporter1 = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: "OAuth2",
                    user: "nodejsa@gmail.com",
                    clientId: "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
                    clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
                    refreshToken: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w"
                },
            });

            const mailOption1 = {
                from: '"Trust Lawyer" <nodejsa@gmail.com>', // sender address
                to: deadLawyer.username, // list of receivers
                subject: "Trust Lawyer (Deleted Account)", // Subject line
                html: `
                <h3>Hi ${deadLawyer.username}</h3>
                <p>It is Informed you that We have removed
                your account from Our Website because 
                we are Unable to verify your License No 
                and Identification.
                You can again create you account with 
                Clear and Authenticate Identification.</p>
                `,
            };

            transporter1.sendMail(mailOption1, (error, info) => {
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


//Get All Client
router.get("/adminDashboardClient", middleware.isAdminLoggedin, (req, res) => {
    Client.find({}, (err, allClients) => {
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("adminDashboardClient", {client: allClients});
        }
    });
});

//Delete - Delete Client
router.delete("/adminDashboardClient/:clientid", middleware.isAdminLoggedin, (req, res) => {
    Client.findByIdAndRemove(req.params.clientid, (err, deadClient) => {
        if(err)
        {
            res.redirect("back");
        }
        else
        {
            req.flash("success", "Client Deleted!");
            res.redirect("/adminDashboardClient");

            //Sending Email
            const transporter2 = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: "OAuth2",
                    user: "nodejsa@gmail.com",
                    clientId: "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
                    clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
                    refreshToken: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w"
                },
            });

            const mailOption2 = {
                from: '"Trust Lawyer" <nodejsa@gmail.com>', // sender address
                to: deadClient.username, // list of receivers
                subject: "Trust Lawyer (Deleted Account)", // Subject line
                html: `
                <h3>Hi ${deadClient.cname}</h3>
                <p>It is Informed you that We have removed
                your account from Our Website because 
                we have received so many complaints by our 
                Lawyers against you.</p>
                `,
            };

            transporter2.sendMail(mailOption2, (error, info) => {
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


//Get All Complains
router.get("/adminDashboardComplain", middleware.isAdminLoggedin, (req, res) => {
    Complain.find({}, (err, allComplains) => {
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("adminDashboardComplain", {complains: allComplains});
        }
    });
});

//Delete - Delete Complain
router.delete("/adminDashboardComplain/:complainid", middleware.isAdminLoggedin, (req, res) => {
    Complain.findByIdAndRemove(req.params.complainid, (err) => {
        if(err)
        {
            res.redirect("back");
        }
        else
        {
            req.flash("success", "Complain Deleted!");
            res.redirect("/adminDashboardComplain");
        }
    });
});





module.exports = router;