
////////////////////////////////////////////////////////////using Cookies and sessions//////////////////////////

const express= require("express");
const bodyParser=require("body-parser");
const ejs= require("ejs");
const mongoose=require("mongoose");
const session= require("express-session");                               //1
const passport= require("passport");                                     //2
const passportLocalMongoose= require("passport-local-mongoose");         //3 no need to require passport-local, because it's included 


app =express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));


app.use(session({                                                       //4  has to be exactly after all "use" and before connection
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false,
    expires: false    // set to false to make the cookie expire when the browsing session ends

}));

app.use(passport.initialize());                                        //5
app.use(passport.session());                                           //6

                                            //DB

mongoose.set('strictQuery',false);                                        // to prevent deprecation error             
mongoose.connect('mongodb://127.0.0.1/userDB');                 // the connection
console.log("Connected to database");                                     //msg

const userSchema = new mongoose.Schema({            //Schema          //7 Schema has to be like this not the standard shape 
    email:String,
    password:String
});

userSchema.plugin(passportLocalMongoose)                              //8 is used to hash and salt the password and to save users into mongodb




const User=new mongoose.model("User", userSchema);

passport.use(User.createStrategy());                                  //9
passport.serializeUser(User.serializeUser());                         //10
passport.deserializeUser(User.deserializeUser());                     //11


app.get("/", function(req,res){
    res.render("home");
});

app.get("/login", function(req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});


app.get("/secrets", function(req,res){           // so simply this get request is as we have no route for secrets and we use it in post register
    if(req.isAuthenticated()){                   // the user has to be able to access this page as long as he is logged in 
        res.render("secrets");                   // if not he will be redirected to the login page
    } else{
        res.redirect("/login");
    }
});

app.get("/logout", function(req,res){            //logout Route that ends the session once using it
    req.logout(function(err){                    // method logout comes from passport
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    });    
});




app.post("/register", function(req, res){

    User.register({username:req.body.username}, req.body.password)                                                        //Method register() is from passportLocalMongoose package
      .then(function(user){
        if(user){
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            });
        }
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/register");
      });
});

app.post("/login",function(req,res){
    const user=new User({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user, function(err){                            //method login() comes from passport
        if(err){
            console.log(err);
        } else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets")
            });
        }
    });                                           
});






app.listen(3000,function(){
    console.log("Server started on port 3000.")
})