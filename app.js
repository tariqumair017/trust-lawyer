const express              = require("express");
const app                  = express();
const flash                = require("connect-flash");
const bcrypt               = require('bcrypt');
const bodyParser           = require("body-parser");
const mongoose             = require("mongoose");
const passport             = require("passport");
const localStrategy        = require("passport-local");  
const methodOverride       = require("method-override");
const multer               = require("multer");
const path                 = require("path");
const Lawyer               = require("./models/lawyer");
const Client               = require("./models/client");
const Admin               = require("./models/admin");
const port     = process.env.PORT || 8000;


const lawyerRoutes = require("./routes/lawyers");
const clientRoutes = require("./routes/clients");
const caseRoutes   = require("./routes/cases");
const indexRoutes  = require("./routes/index");
const adminRoutes  = require("./routes/admin");
const client = require("./models/client");



//mongoose.connect("mongodb://localhost:27017/fyp_v1" , { useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect("mongodb+srv://umair:Imv5f9AZN4i023FO@cluster0.rqbog.mongodb.net/tlawyers?retryWrites=true&w=majority");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public/"));
app.use(methodOverride("_method"));
app.use(flash());


// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Pracha is my good Son!",
    resave: false,
    saveUninitialized: false
})); 

//For Lawyer
passport.use('Lawyer',new localStrategy((username, password, done) => {
            //------------ User Matching ------------//
            //console.log(username)
            Lawyer.findOne({username:username}).then(user => {
                //console.log(user)
                if (!user) {
                    return done(null, false, { message: 'This Email ID is not registered!!!' });
                    //console.log("This Username or email ID is not registered");
                }

                //------------ Password Matching ------------//
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) {console.log(err)};
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Password incorrect! Try again please!!' });
                        //console.log("Password incorrect! Please try again.");
                    }
                });
        });
}));
passport.serializeUser((Lawyer,done)=>{
    done(null,Lawyer);
});
passport.deserializeUser(function(Lawyer, done) {
    if(Lawyer!=null)
      done(null,Lawyer);
  });

//For Client
passport.use('Client',new localStrategy((username, password, done) => {
    //------------ User Matching ------------//
    //console.log(username)
    Client.findOne({username:username}).then(user => {
        //console.log(user)
        if (!user) {
            console.log("This Username or email ID is not registered");
            return done(null, false, { message: 'This Email ID is not registered!!' });
        }

        //------------ Password Matching ------------//
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {console.log(err)};
            if (isMatch) {
                return done(null, user);
            } else {
                console.log("Password incorrect! Please try again.");
                return done(null, false, { message: 'Password incorrect! Please try again!!' });
            }
        });
});
}));
passport.serializeUser((Client,done)=>{
done(null,Client);
});
passport.deserializeUser(function(Client, done) {
if(Client!=null)
done(null,Client);
});

//For Admin
passport.use('Admin',new localStrategy((username, password, done) => {
    //------------ User Matching ------------//
    Admin.findOne({username:username}).then(user => {
        if (!user) {
            return done(null, false, { message: 'This Email ID is not registered' });
            //console.log("This Username or email ID is not registered");
        }

        //------------ Password Matching ------------//
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {console.log(err)};
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password incorrect! Please try again.' });
                //console.log("Password incorrect! Please try again.");
            }
        });
});
}));
passport.serializeUser((Admin,done)=>{
done(null,Admin);
});
passport.deserializeUser(function(Admin, done) {
if(Admin!=null)
done(null,Admin);
});
// passport.use('Client',new localStrategy(Client.authenticate()));
// passport.serializeUser((Client, done) => {
//     done(null, Client);
// });
// passport.deserializeUser((Client, done) => {
//     if(Client != null)
//         done(null, Client);
// });

app.use(passport.initialize());
app.use(passport.session());


//Middleware for accessing locals at every page
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.status;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});


app.use(lawyerRoutes);
app.use(clientRoutes);
app.use(caseRoutes);
app.use(indexRoutes);
app.use(adminRoutes);





// Tell Express to Listen request
app.listen(port, () => {
    console.log(`Server has started at http://localhost:${port}`);
  });
