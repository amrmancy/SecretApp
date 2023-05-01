
///////////////////////////////////////using OAuth20- Open Authorization with google ///////////////////////////////
require('dotenv').config();
const express= require("express");
const bodyParser=require("body-parser");
const ejs= require("ejs");
const mongoose=require("mongoose");
const session= require("express-session");                               //1
const passport= require("passport");                                     //2
const passportLocalMongoose= require("passport-local-mongoose");         //3 no need to require passport-local, because it's included 
const GoogleStrategy = require('passport-google-oauth20').Strategy;     //1 OAuth20
const findOrCreate=require("mongoose-findorcreate");                    //3 OAuth20

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
    password:String,
    googleId:String        //by adding this line (googleId:String) in the Schema the user will be added once in the DB
});

userSchema.plugin(passportLocalMongoose);                             //8 is used to hash and salt the password and to save users into mongodb
userSchema.plugin(findOrCreate);                                      //4 OAuth20



const User=new mongoose.model("User", userSchema);

passport.use(User.createStrategy());                                  //9
                         
passport.serializeUser(function(user, cb) {                           //10  ,changed to fit all kind of authentications(local,google,...)
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {                      //11  ,changed to fit all kind of authentications(local,google,...)
    process.nextTick(function() {
      return cb(null, user);
    });
  });                    


passport.use(new GoogleStrategy({                  //2 OAuth20
    clientID:process.env.CLIENT_ID,               // to access an env file you need process.env.varName
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",  //from googleCloud
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/", function(req,res){
    res.render("home");
});
                                                              //5 OAuth20
app.get("/auth/google",                                       //this will show a pop up to sign with google
  passport.authenticate("google", { scope: ["profile"] }));   //Scope is means targeting to know the user's profile(email, google id)

app.get("/auth/google/secrets",                                   //6 OAuth20
  passport.authenticate("google", { failureRedirect: "/login" }),  //after authorization redirect to secrets page
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
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