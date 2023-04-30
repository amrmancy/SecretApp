require("dotenv").config();
const express= require("express");
const bodyParser=require("body-parser");
const ejs= require("ejs");
const mongoose=require("mongoose");
const md5= require("md5");


const app =express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));


                                            //DB

mongoose.set('strictQuery',false);                                        // to prevent deprecation error             
mongoose.connect('mongodb://127.0.0.1/userDB');                 // the connection
console.log("Connected to database");                                     //msg

const userSchema = new mongoose.Schema({                              //Schema
    email:String,
    password:String
});





const User=new mongoose.model("User", userSchema);

app.get("/", function(req,res){
    res.render("home");
});

app.get("/login", function(req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});

app.post("/register", function(req, res){
    const newUser=new User({
        email:req.body.username,
        password: md5(req.body.password)           // using md5 for hashing
    });
    newUser.save()
    .then(() => {
      res.render("secrets");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = md5(req.body.password);        // using md5 for hashing, will compare hashed password with hashed hashed password in DB
    User.findOne({email:username})
    .then((foundUser) => {
        if(foundUser){
            if(foundUser.password === password){
                res.render("secrets");
            }
        }
      })
      .catch((err) => {
        console.log(err);
      });
});



app.listen(3000,function(){
    console.log("Server started on port 3000.")
})