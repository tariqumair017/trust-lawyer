const Lawyer     = require("../models/lawyer");
const Client     = require("../models/client");
const Admin      = require("../models/admin");



//All middleware are here
let middlewareObj = {};

middlewareObj.lawyerExistForReset = function(req, res, next)
{
            Lawyer.findById(req.params.id, (err, foundLawyer) => {
                if(foundLawyer)
                {
                    //req.flash("error", "Wallets Not Found!");
                    console.log("Okay Lawyer You can Move Now");
                    next();
                }
                else
                {
                    console.log(err);
                    console.log("Lawyer You are Not Register!");
                    req.flash("error", "You are Not Register!");
                    res.redirect("back");                                          
                }
            });
}


middlewareObj.clientExistForReset = function(req, res, next)
{
            Client.findById(req.params.ed, (err, foundClient) => {
                if(foundClient)
                {
                    //req.flash("error", "Wallets Not Found!");
                    console.log("Okay Client You can Move Now");
                    next();
                }
                else
                {
                    console.log(err);
                    console.log("Client You are Not Register!");
                    req.flash("error", "You are Not Register!");
                    res.redirect("back");                           
                }
            });
}


middlewareObj.adminExistForReset = function(req, res, next)
{
            Admin.findById(req.params.ed, (err, foundAdmin) => {
                if(foundAdmin)
                {
                    //req.flash("error", "Wallets Not Found!");
                    console.log("Okay Admin You can Move Now");
                    next();
                }
                else
                {
                    console.log(err);
                    console.log("Admin You are Not Register!");
                    req.flash("error", "You are Not Register!");
                    res.redirect("back");                           
                }
            });
}
//middlewareObj.checkCommentOwnership = function(req, res, next)
//{
//    //is user Logged in?
//    if(req.isAuthenticated())
//        {
//            Comment.findById(req.params.comment_id, (err, foundComment) => {
//                if(err)
//                {
//                    res.redirect("back");
//                }
//                else
//                {
//                    //does user create the Comment?
//                    if(foundComment.author.id.equals(req.user._id))
//                    {
//                        next();
//                    }
//                    else
//                    {
//                        req.flash("error", "You Don't have Permission to do that!");
//                        res.redirect("back");
//                    }             
//                }
//            });
//        }
//        else
//        {
//            req.flash("error", "Please Login First!");
//            res.redirect("back");
//        }
//}

middlewareObj.isLawyerLoggedin = function(req, res, next)
{  
    if(req.isAuthenticated())
        {
            Lawyer.findById(req.user._id, (err, lawyer) => {
                if(err)
                {
                    console.log(err);
                }
                else
                {  
                  if(lawyer)
                    {
                      return next();
                    }
                  else
                    {
                      req.flash("error", "You are Not Register!");
                      res.redirect("back");
                    }
                }
            });
        }
        else
        {
            req.flash("error", "Please Login First!");
            res.redirect("/lawyer-login");
        }
}

middlewareObj.isClientLoggedin = function(req, res, next)
{
    if(req.isAuthenticated())
        {
            Client.findById(req.user._id, (err, client) => {
                if(err)
                {
                    console.log(err);
                }
                else
                {
                    if(client)
                    {
                        return next();
                    }
                    else
                    {
                        req.flash("error", "You are not Register!");
                        res.redirect("/client-login");
                    }
                }
            });
        }
    else
        {
            req.flash("error", "Please Login First!");
            res.redirect("/client-login");
        }
}


middlewareObj.isAdminLoggedin = function(req, res, next)
{
    if(req.isAuthenticated())
    {
        Admin.findById(req.user._id, (err, admin) => {
            if(err)
            {
                console.log(err);
            }
            else
            { 
                if(admin)
                {
                    return next();
                }
                else
                {
                    req.flash("error", "You are not Register!");
                    res.redirect("back");
                }
            }
        });
    }
    else
    {
        req.flash("error", "Please Login First!");
        res.redirect("/client-login");
    }
}


module.exports = middlewareObj;