const express              = require("express");
const router               = express.Router();
const passport             = require("passport");
const bcryptjs             = require('bcryptjs');
const bcrypt               = require('bcrypt');
const { google }           = require("googleapis");
const OAuth2               = google.auth.OAuth2;
const jwt                  = require('jsonwebtoken');
const JWT_KEY              = "jwtactive987";
const JWT_RESET_KEY        = "jwtreset987";
const multer               = require("multer");
const nodemailer           = require('nodemailer');
const localStrategy        = require("passport-local");  
const Lawyer               = require("../models/lawyer");
const Client               = require("../models/client");
const Case                 = require("../models/case");
const middleware           = require("../middleware/index");



const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

//Middleware (Image Uploading) 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/images/uploads/");
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    },
  });
var upload = multer({ storage: storage });
var uploadMultiple = upload.fields([{ name: 'file1'}, { name: 'file2'}]);


//Show Lawyer Sign Up form
router.get("/lawyer-signup", (req, res) => {
    res.render("lawyer-signup");
});
//Handel Lawyer Sign Up Logic
router.post("/lawyer-signup", uploadMultiple, async (req, res) => {
      
      if (req.files.cnicf) {
        const { filename: file1 } = req.files.file1[0];
        const { filename: file2 } = req.files.file2[0];
  
        await sharp(req.files.file1[0].path)
          .resize(300, 300)
          .jpeg({ quality: 90 })
          .toFile(path.resolve(req.files.file1[0].destination, "resized", file1));
        fs.unlinkSync(req.files.file1[0].path);
  
        await sharp(req.files.file2[0].path)
          .resize(300, 300)
          .jpeg({ quality: 90 })
          .toFile(path.resolve(req.files.file2[0].destination, "resized", file2));
        fs.unlinkSync(req.files.file2[0].path);
      }
      const {
        name,
        city,
        address,
        phone,
        username,
        password,
        cpassword,
        special,
        experience,
        license,
        cnic,
        date,
      } = req.body;
  
      let errors = [];
  
      //------------ Checking password mismatch ------------//
      if (password != cpassword) {
        console.log("Passwords do not match");
        req.flash("error", "Passwords do not match");
        return res.redirect("/lawyer-signup");
      }
  
      //------------ Checking password length ------------//
      if (password.length < 8) {
        console.log("Password must be at least 8 characters");
        req.flash("error", "Password must be at least 8 characters");
        return res.redirect("/lawyer-signup");
      }

      if (errors.length > 0) {
        return res.redirect("/lawyer-signup");
      } else
      {
        Lawyer.findOne({username: username}).then((lawywer) => {
    
          if (lawywer) {
            console.log("matched");
            //------------ User already exists ------------//
            console.log("Username or Email ID already registered");
            req.flash("error", "Email ID already registered");
            return res.redirect("/lawyer-signup");
          } else {
            const newUser = new Lawyer({
               name: req.body.name,
               city: req.body.city,
               address: req.body.address,
               phone: req.body.phone,
               username: req.body.username,
               special: req.body.special,
               experience: req.body.experience,
               license: req.body.license,
               cnic: req.body.cnic,
               date: req.body.date,
               password : req.body.password,
            });
            bcryptjs.genSalt(10, (err, salt) => {
              bcryptjs.hash(newUser.password, salt, (err, hash) => {
                if (err) {
                  console.log(err);
                }
                  newUser.password = hash;
                  newUser.file1 = req.files.file1[0].filename;
                  newUser.file2 = req.files.file2[0].filename;
                  newUser
                    .save()
                    .then((lawywer) => {
                        res.redirect('/lawyer-login');
                    })
                    .catch((err) => console.log(err));
                
              });
            });
          }
        });
      }
});

//Show Lawyer Forget Password form
router.get("/lawyerForgot", (req, res) => {
    res.render("lawyerForgetPassword");
});

//Forgot Password Handle
router.post("/lawyerForgot", (req, res) => {
    const email = req.body.email;
    let errors = [];

    //------------ Checking required fields ------------//
    if (!email) {
        req.flash("error", "Please enter an email ID");
        return res.redirect('/lawyerForgot');
    }

    if (errors.length > 0) 
    {
        return res.redirect('/lawyerForgot');
    } 
    else 
    {
        Lawyer.findOne({username: email}).then(user => {
            if (!user) {
                //------------ User already exists ------------//
                console.log('User with Email ID does not exist!');
                req.flash("error", "User with Email ID does not exist!");
                return res.redirect('/lawyerForgot');
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
                <h2>Lawyer Please click on below link to reset your account password</h2>
                <p>${CLIENT_URL}/lawyerForgot/${token}</p>
                <p><b>NOTE: </b> The activation link expires in 30 minutes.</p>
                `;

                Lawyer.updateOne({ resetLink: token }, (err, success) => {
                    if (err) {
                        req.flash("error", "Error resetting password!");
                        return res.redirect('/lawyerForgot');
                    }
                    else {
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

                        // send mail with defined transport object
                        const mailOptions = {
                            from: '"Trust Lawyer" <nodejsa@gmail.com>', // sender address
                            to: email, // list of receivers
                            subject: "Lawyer Account Password Reset: Trust Lawyer Auth ✔", // Subject line
                            html: output, // html body
                        };

                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.log(error);
                               console.log("Something went wrong on our end. Please try again later.");
                               return res.redirect('/lawyerForgot');
                            }
                            else {
                                console.log('Mail sent : %s', info.response);
                               console.log("Password reset link sent to email ID. Please follow the instructions.");
                               req.flash("success", "Password reset link sent to email ID. Please follow the instructions!");
                               return res.redirect('/lawyer-login');
                            }
                        })
                    }
                })

            }
        });
    }
});

//Reset Password Handle
router.get('/lawyerForgot/:token', (req, res) => {
    const { token } = req.params;

    if (token) {
        jwt.verify(token, JWT_RESET_KEY, (err, decodedToken) => {
            if (err) {
               console.log("Incorrect or expired link! Please try again.");
               req.flash("error", "User with Email ID does not exist!");
               return res.redirect('/lawyerForgot');
            }
            else {
                const { _id } = decodedToken;
                Lawyer.findById(_id, (err, user) => {
                    if (err) {
                        console.log("User with email ID does not exist! Please try again.");
                        req.flash("error", "Please try again!");
                        return res.redirect('/lawyer-login');
                    }
                    else {
                        res.redirect(`/lawyerReset/${_id}`)
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
router.get("/lawyerReset/:id", middleware.lawyerExistForReset, (req, res) => {
    // console.log(id)
    res.render("lawyerResetPassword", { id: req.params.id })
});

//Reset Password Handle
router.post('/lawyerReset/:id', middleware.lawyerExistForReset, (req, res) => {
    var { password, password2 } = req.body;
    const id = req.params.id;
    let errors = [];

    //------------ Checking required fields ------------//
    if (!password || !password2) {
        console.log("Please enter all fields");
        req.flash("error", "Please enter all fields!");
        return res.redirect(`/lawyerReset/${id}`);
    }

    //------------ Checking password length ------------//
    else if (password.length < 8) {
        console.log("Password must be at least 8 characters.");
        req.flash("error", "Password must be at least 8 characters!");
        return res.redirect(`/lawyerReset/${id}`);
    }

    //------------ Checking password mismatch ------------//
    else if (password != password2) {
        console.log("Passwords do not match.");
        req.flash("error", "Passwords do not match!");
        return res.redirect(`/lawyerReset/${id}`);
    }

    else 
    {
        bcryptjs.genSalt(10, (err, salt) => {
            bcryptjs.hash(password, salt, (err, hash) => {
                if (err) throw err;
                password = hash;

                Lawyer.findByIdAndUpdate(
                    { _id: id },
                    { password },
                    function (err, result) {
                        if (err) {
                            console.log("Error resetting password!");
                            req.flash("error", "Error resetting password!");
                            return res.redirect(`/lawyerReset/${id}`);
                        } else {
                            console.log("Password reset successfully!");
                            req.flash("success", "Password reset successfully!");
                            return res.redirect('/lawyer-login');
                        }
                    }
                );

            });
        });             
    }
});


//Show Lawyer Login form
router.get("/lawyer-login", (req, res) => {
    res.render("lawyer-login");
});

//Handel Login Logic ("/login", middleware, callback)
router.post("/lawyer-login", (req, res, next) => {
    passport.authenticate("Lawyer", {
      successRedirect: "/dashboard",
      failureRedirect: "/lawyer-login",
      failureFlash: true,
    })(req, res, next);
});
//router.post("/lawyer-login", (req, res) => {
//    passport.authenticate("Lawyer")(req, res, () => {
//        if(req.isAuthenticated()){
//            status = "lawyer";
//            res.redirect("/dashboard");
//        }
//        else
//        {
//            //req.flash("error", "Please Login First!");
//            res.redirect("/lawyer-login");
//        }
//    })
//});


//Showing all Lawyers from DB
router.get("/lawyers", (req, res) => {
    Lawyer.find({}, (err, allLawyers) => {
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("lawyers-grid", {data: allLawyers});
        }
    });
});

//Filter Lawyer
router.post("/lawyers", (req, res) => {
    var filterName = req.body.name;
    var filterCity = req.body.city;
    
    if(filterName !='' && filterCity !='')
    {
        var filterParameter = { $and:[{name:filterName}, {city:filterCity}] }
    }else if(filterName !='' && filterCity =='')
    {
        var filterParameter = { $or:[{name:filterName}, {city:filterCity}] }
    }else if(filterName =='' && filterCity !='')
    {
        var filterParameter = { $or:[{name:filterName}, {city:filterCity}] }
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
            res.render("lawyers-grid", {data: allLawyers});
        }
    });
});

//Show more info about one Lawyer
router.get("/lawyers/:id", middleware.isClientLoggedin, (req, res) => {
    //find the lawyer with provided ID
    Lawyer.findById(req.params.id, (err, foundlawyer) => {
        if(err)
        {
            console.log(err);
        }
        else
        {  
            res.render("single-lawyer", {found: foundlawyer});
        }
    });
});


// Lawyer Dashboard
router.get("/dashboard", middleware.isLawyerLoggedin, (req, res) => {
    Lawyer.findById(req.user._id).populate("cases").exec((err, foundlawyer) => {
        if(err)
        {
            console.log(err);
        }
        else
        { 
            status = "lawyer";
            res.render("dashboard", {find: foundlawyer});
        }
    });
});
//Lawyer Appointments
router.get("/appointments", middleware.isLawyerLoggedin, (req, res) => {
    Lawyer.findById(req.user._id, (err, foundlawyer) => {
        if(err)
        {
            console.log(err);
        }
        else
        { 
            res.render("appointments", {find: foundlawyer});
        }
    });
});

//View - View Lawyer Profile
router.get("/dashboard/lawyerProfile", middleware.isLawyerLoggedin, (req, res) => {
    Lawyer.findById(req.user._id, (err, findLawyer) => {
        res.render("lawyerProfile", {getLawyer: findLawyer})     
    });
});

//Edit - Edit Lawyer Profile
router.get("/dashboard/lawyerProfile/edit", middleware.isLawyerLoggedin, (req, res) => {
    Lawyer.findById(req.user._id, (err, findWallet) => {
        res.render("updateLawyerProfile", {getLawyer: findWallet})     
    });
});

//Update - Update Lawyer Profile
router.put("/dashboard/lawyerProfile", middleware.isLawyerLoggedin, (req, res) => {
    
    var collection = {  
        name: req.body.name,
        city: req.body.city,
        address: req.body.address,
        phone: req.body.phone,
        cnic: req.body.cnic,
        special: req.body.special,
        experience: req.body.experience
    };
    
    //find and update the correct Lawyer
    Lawyer.findByIdAndUpdate(req.user._id, collection, (err, updatedlawyer) => {
        if(err)
        {
            console.log(err);
            res.redirect("back");
        }
        else
        {
            req.flash("success", "Profile Updated!!!");
            res.redirect("/dashboard/lawyerProfile");
        }
    });
});

//Update - Update Lawyer Profile Image
router.put("/dashboard/lawyerimage", uploadMultiple, middleware.isLawyerLoggedin, async (req, res) => {
    
    if (req.files.cnicf) {
        const { filename: file2 } = req.files.file2[0];

        await sharp(req.files.file2[0].path)
          .resize(300, 300)
          .jpeg({ quality: 90 })
          .toFile(path.resolve(req.files.file2[0].destination, "resized", file2));
        fs.unlinkSync(req.files.file2[0].path);
      }

        var newPic = {file2: req.files.file2[0].filename};
      //find and update the correct Lawyer
    Lawyer.findByIdAndUpdate(req.user._id, newPic, (err, updatedlawyer) => {
        if(err)
        {
            console.log(err);
            res.redirect("back");
        }
        else
        {
            req.flash("success", "Profile Picture Updated!!!");
            res.redirect("/dashboard/lawyerProfile");
        }
    });
});

//Change Password - Get Lawyer Change Password
router.get("/dashboard/lawyerProfile/change", middleware.isLawyerLoggedin, (req, res) => {
    res.render("lawyerChangePassword");       
});

//Change Password - Update Lawyer Password
router.put("/dashboard/lawyerProfile/changed", middleware.isLawyerLoggedin, async (req, res) => {
    var oPassword = req.body.oldpassword;
    var nPassword = req.body.newpassword;
    var cPassword = req.body.cpassword;

     //------------ Checking password mismatch ------------//
     if (nPassword != cPassword) {
        console.log("New and Confirm Passwords do not match");
        req.flash("error", "New and Confirm Passwords do not match!");
        return res.redirect("/dashboard/lawyerProfile/change");    
      }
  
      //------------ Checking password length ------------//
      if (nPassword.length < 8) {
        console.log("Password must be at least 8 characters");
        req.flash("error", "Password must be at least 8 characters!");       
        return res.redirect("/dashboard/lawyerProfile/change"); 
      }
      else
      {
        try {
            // get user
            const user = await Lawyer.findOne({username:req.user.username});
            if (!user) {
                req.flash("error", "User not found!");
                console.log('User not found');
                return res.render("lawyerChangePassword");
            }
            // validate old password
            const isValidPassword = await bcrypt.compare(oPassword, user.password);
                if(!isValidPassword)
                {
                    req.flash("error", "Old password is Incorrect!");
                    console.log('Please enter correct old password');
                    return res.redirect("/dashboard/lawyerProfile/change");
                }
                else
                {
                  bcryptjs.genSalt(10, (err, salt) => {
                      bcryptjs.hash(nPassword, salt, (err, hash) => {
                        if (err) {
                          console.log(err);
                        }
                          user.password = hash;
                          user.save().then((lawywer) => {
                              req.flash("success", "Password Updated Successfully!");
                              res.redirect("/dashboard/lawyerProfile/change");
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