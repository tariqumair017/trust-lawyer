const express           = require("express");
const router            = express.Router();
const Complain          = require("../models/complain");


// ROUTES
router.get("/", (req, res) => {
    res.render("index");
});

router.get("/contact", (req, res) => {
    res.render("contact-us");
});

router.get("/AboutUs", (req, res) => {
    res.render("about");
});

router.get("/services", (req, res) => {
    res.render("services");
});

router.get("/gallery", (req, res) => {
    res.render("gallery");
});

router.get("/help", (req, res) => {
    res.render("help");
});

router.post("/help", (req, res) => {
    let newComplain = new Complain({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        date: req.body.date,
        message: req.body.message
    });

    Complain.create(newComplain, (err, comp) => {
        if(err)
        {
            console.log(err);
            return res.render("help");
        }
            req.flash("success", "Your message sent successfully!");
            res.redirect("/help");
       });
});

router.get("/Asking", (req, res) => {
    res.render("asking");
});


//Logout Route
router.get("/logout", (req, res)=> {
    req.logout();
    //req.flash("success", "Logged you Out!");
    res.redirect("/");
});



module.exports = router;