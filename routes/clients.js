const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcryptjs = require('bcryptjs');
const bcrypt = require('bcrypt');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const jwt = require('jsonwebtoken');
const JWT_KEY = "jwtactive987";
const JWT_RESET_KEY = "jwtreset987";
const localStrategy = require("passport-local");
const nodemailer = require('nodemailer');
const Client = require("../models/client");
const Case = require("../models/case");
const middleware = require("../middleware/index");



//Show Client Sign Up form
router.get("/client-signup", (req, res) => {
    res.render("client-signup");
});
//Handel Client Sign Up Logic
router.post("/client-signup", (req, res) => {   
    //New
    const {
        cname,
        ccity,
        caddress,
        cphone,
        ccnic,
        username,
        password,
        cpassword,
    } = req.body;

    var errors = [];

    //------------ Checking password mismatch ------------//
    if (password != cpassword) {
        //errors.push({ msg: 'Passwords do not match' });
        req.flash("error", "Passwords do not match");
        return res.redirect("/client-signup");
    }

    //------------ Checking password length ------------//
    if (password.length < 8) {
        //errors.push({ msg: 'Password must be at least 8 characters' });
        req.flash("error", "Password must be at least 8 characters");
        return res.redirect("/client-signup");
    }

    if (errors.length > 0) {
        return res.redirect("/client-signup");
    } else {
        Client.findOne({ username: username }).then((client) => {

            if (client) {
                console.log("matched");
                //------------ User already exists ------------//
                //errors.push({ msg: 'This Email ID already registered' });
                req.flash("error", "Email ID already registered");
                return res.redirect("/client-signup");
            } else {
                const newClient = new Client({
                    cname: req.body.cname,
                    ccity: req.body.ccity,
                    caddress: req.body.caddress,
                    cphone: req.body.cphone,
                    ccnic: req.body.ccnic,
                    username: req.body.username,
                    password: req.body.password,
                });
                bcryptjs.genSalt(10, (err, salt) => {
                    bcryptjs.hash(newClient.password, salt, (err, hash) => {
                        if (err) 
                        {
                            console.log(err);
                        }
                        else 
                        {
                            newClient.password = hash;
                            newClient.save().then((lawywer) => {
                                res.redirect('/client-login');
                            })
                                .catch((err) => console.log(err));
                        }
                    });
                });
            }
        });
    }
});

//Show Client Forget Password form
router.get("/clientForgot", (req, res) => {
    res.render("clientForgetPassword");
});

//Forgot Password Handle
router.post("/clientForgot", (req, res) => {
    const email = req.body.email;
    var errors = [];

    //------------ Checking required fields ------------//
    if (!email) {
        //errors.push({ msg: 'Please enter an email ID' });
        req.flash("error", "Please enter an email ID");
        return res.redirect('/clientForgot');
    }

    if (errors.length > 0) {
        return res.redirect('/clientForgot');
    }
    else {
        Client.findOne({ username: email }).then(user => {
            if (!user) {
                //------------ User already exists ------------//
                //console.log('Client: User with Email ID does not exist!');
                //errors.push({ msg: 'User with Email ID does not exist!' });
                req.flash("error", "User with Email ID does not exist!");
                return res.redirect('/clientForgot');
            }
            else {
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
              <h2>Client Please click on below link to reset your account password</h2>
              <p>${CLIENT_URL}/clientForgot/${token}</p>
              <p><b>NOTE: </b> The activation link expires in 30 minutes.</p>
              `;

                Client.updateOne({ resetLink: token }, (err, success) => {
                    if (err) {
                        //console.log('Error resetting password!');
                        req.flash("error", "Error resetting password!");
                        return res.redirect('/clientForgot');
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
                            subject: "Client Account Password Reset: Trust Lawyer Auth ✔", // Subject line
                            html: output, // html body
                        };

                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.log(error);              
                                console.log("Something went wrong on our end. Please try again later.");
                                //errors.push({ msg: 'Something went wrong on our end. Please try again later.' });
                                return res.redirect('/clientForgot');
                            }
                            else {
                                console.log('Mail sent : %s', info.response);
                                console.log("Password reset link sent to email ID. Please follow the instructions.");
                                req.flash("success", "Password reset link sent to email ID. Please follow the instructions!");
                                return res.redirect('/client-login');
                            }
                        })
                    }
                })

            }
        });
    }
});

//Reset Password Handle
router.get('/clientForgot/:tookeen', (req, res) => {
    const { tookeen } = req.params;
    var errors = [];

    if (tookeen) {
        jwt.verify(tookeen, JWT_RESET_KEY, (err, decodedToken) => {
            if (err) {
                console.log("Incorrect or expired link! Please try again.");
                //errors.push({ msg: 'Incorrect or expired link! Please try again.' });
                req.flash("error", "User with Email ID does not exist!");
                return res.redirect('/clientForgot');
            }
            else {
                const { _id } = decodedToken;
                Client.findById(_id, (err, user) => {
                    if (err) {
                        console.log("User with email ID does not exist! Please try again.");
                        req.flash("error", "Please try again!");
                        return res.redirect('/client-login');
                    }
                    else {
                        res.redirect(`/clientReset/${_id}`)
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
router.get("/clientReset/:ed", middleware.clientExistForReset, (req, res) => {
    // console.log(ed)
    res.render("clientResetPassword", { ed: req.params.ed })
});

//Reset Password Handle
router.post('/clientReset/:ed', middleware.clientExistForReset, (req, res) => {
    var { password, password2 } = req.body;
    const ed = req.params.ed;
    var errors = [];

    //------------ Checking required fields ------------//
    if (!password || !password2) {
        console.log("Please enter all fields");
        req.flash("error", "Please enter all fields!");
        return res.redirect(`/clientReset/${ed}`);
    }

    //------------ Checking password length ------------//
    else if (password.length < 8) {
        console.log("Password must be at least 8 characters.");
        req.flash("error", "Password must be at least 8 characters!");
        return res.redirect(`/clientReset/${ed}`);
    }

    //------------ Checking password mismatch ------------//
    else if (password != password2) {
        console.log("Passwords do not match.");
        req.flash("error", "Passwords do not match!");
        return res.redirect(`/clientReset/${ed}`);
    }

    else {
        bcryptjs.genSalt(10, (err, salt) => {
            bcryptjs.hash(password, salt, (err, hash) => {
                if (err) throw err;
                password = hash;

                Client.findByIdAndUpdate(
                    { _id: ed },
                    { password },
                    function (err, result) {
                        if (err) {
                            console.log("Error resetting password!");
                            req.flash("error", "Error resetting password!");
                            return res.redirect(`/clientReset/${ed}`);
                        } else {
                            console.log("Password reset successfully!");
                            req.flash("success", "Password reset successfully!");
                            return res.redirect('/client-login');
                        }
                    }
                );

            });
        });
    }
});


//Show Client Login form
router.get("/client-login", (req, res) => {
    res.render("client-login");
});

//Handel Client Login Logic ("/login", middleware, callback)
// router.post("/client-login", (req, res) => {
//     passport.authenticate("Client")(req, res, function (){
//         console.log("masla ni ha")
//         status = "client";
//         res.redirect("/client-dashboard");
//     })    
// });
router.post("/client-login", (req, res, next) => {
    passport.authenticate("Client", {
    successRedirect: "/client-dashboard",
    failureRedirect: "/client-login",
    failureFlash: true,
  })(req, res, next);
});

//Client Dashboard
router.get("/client-dashboard", middleware.isClientLoggedin, (req, res) => {
    Case.find({}, (err, foundCase) => {
        if (err) {
            console.log(err);
        }
        else {
            status = "client"
            res.render("client-dashboard", { find: foundCase });
        }
    });
});

//View - View Client Profile
router.get("/client-dashboard/clientProfile", middleware.isClientLoggedin, (req, res) => {
    Client.findById(req.user._id, (err, findClient) => {
        res.render("clientProfile", { findedClient: findClient })
    });
});

//Edit - Edit Client Profile
router.get("/client-dashboard/clientProfile/edit", middleware.isClientLoggedin, (req, res) => {
    Client.findById(req.user._id, (err, findClient) => {
        res.render("updateClientProfile", { getClient: findClient })
    });
});

//Update - Update Client Profile
router.put("/client-dashboard/clientProfile", middleware.isClientLoggedin, (req, res) => {
    //find and update the correct Lawyer
    Client.findByIdAndUpdate(req.user._id, req.body.data, (err, updatedClient) => {
        if (err) {
            console.log(err);
            res.redirect("back");
        }
        else {
            req.flash("success", "Profile Updated!!!");
            res.redirect("/client-dashboard/clientProfile");
        }
    });
});

//Change Password - Get Client Change Password Form
router.get("/client-dashboard/clientProfile/change", middleware.isClientLoggedin, (req, res) => {
    res.render("clientChangePassword");
});

//Change Password - Update Client Password
router.put("/client-dashboard/clientProfile/changed", middleware.isClientLoggedin, async (req, res) => {
    var oPassword = req.body.oldpassword;
    var nPassword = req.body.newpassword;
    var cPassword = req.body.confirmpassword;

    //------------ Checking password mismatch ------------//
    if (nPassword != cPassword) {
        console.log("New and Confirm Passwords do not match");
        req.flash("error", "New and Confirm Passwords do not match!");
        return res.redirect("/client-dashboard/clientProfile/change");
    }

    //------------ Checking password length ------------//
    if (nPassword.length < 8) {
        req.flash("error", "Password must be at least 8 characters!");
        console.log("Password must be at least 8 characters");
        return res.redirect("/client-dashboard/clientProfile/change");
    }
    else {
        try {
            // get user
            const user = await Client.findOne({ username: req.user.username });
            if (!user) {
                req.flash("error", "User not found!");
                console.log('User not found');
                return res.render("clientChangePassword");
            }
            // validate old password
            const isValidPassword = await bcrypt.compare(oPassword, user.password);
            if (!isValidPassword) {
                req.flash("error", "Old password is Incorrect!");
                console.log('Please enter correct old password');
                return res.redirect("/client-dashboard/clientProfile/change");
            }
            else {
                bcryptjs.genSalt(10, (err, salt) => {
                    bcryptjs.hash(nPassword, salt, (err, hash) => {
                        if (err) {
                            console.log(err);
                        }
                        user.password = hash;
                        user.save().then((lawywer) => {
                            req.flash("success", "Password Updated Successfully!");
                            res.redirect("/client-dashboard/clientProfile/change");
                            console.log("Password Updated Successfully");
                        })
                            .catch((err) => console.log(err));
                    });
                });
            }

        } catch (err) {
            console.log(err);
            console.log('Something went wrong. Try again');
        }
    }
});




module.exports = router;