require('dotenv').config();
const express = require("express");
const app = express();
const path = require("path"); //this is to join the path ahead of the main directory
const Register = require("./models/registers"); //this is schema in database
const hbs = require('hbs');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { cookie } = require('express/lib/response');
const cookieParser = require('cookie-parser');
const auth = require("./middlewares/auth");
const port = process.env.port || 3000;

//Middlewares
app.use(express.json()); //To get all data from webpage (request body)
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); //you can request cookie from header

//Template engine settings
app.use(express.static("public"));
app.set("view engine", "hbs");
hbs.registerPartials(__dirname + "/views/partials"); //partials kaha hai batana padta hai saale ko


//ENDPOINTS
app.get("/secret", auth, (req, res) => {
    // console.log(`this is cookie: ${req.cookies.jwt}`);
    res.render("secret");
});
app.get("/", (req, res) => {
    res.render("index");
});

app.post("/", async (req, res) => {
    const password = req.body.password;
    const cpassword = req.body.cpassword;
    if (password == cpassword) {
        const registerEmployee = new Register({
            name: req.body.thename,
            registrationNo: req.body.regno,
            phoneNo: req.body.phone,
            course: req.body.course,
            password: req.body.password,
            cpassword: req.body.cpassword,
        });

        const token = await registerEmployee.generateAuthToken();

        res.cookie("jwt", token, {  //store the token into the cookie header
            expires: new Date(Date.now() + 600000),
            httpOnly: true
        });

        registerEmployee.save();
        res.send("succesful");
    }
    else {
        res.send("Passwords are not matching.")
    }

});

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/login", async (req, res) => {
    const regno = req.body.regno;
    const pass = req.body.password;
    const getregno = await Register.findOne({ registrationNo: regno });

    const token = await getregno.generateAuthToken(); //getregno is the instance of Register

    res.cookie("jwt", token, {  //store the token into the cookie header
        expires: new Date(Date.now() + 600000),
        httpOnly: true
    });

    const isMatch = await bcrypt.compare(pass, getregno.password);   //check hash value of entered pass & stored pass
    if (isMatch)
        res.render("home");
    else
        res.send("Invalid Credentials!")
})

app.get("/logout", auth, async (req, res) => {
    try {
        // //for one device logout
        // req.user.tokens= req.user.tokens.filter((currElement)=>{
        //     return currElement.token != req.token //delte req.token and leave everything else
        // })

        //logout from all devices at once
        req.user.tokens = [];

        res.clearCookie("jwt");
        console.log("Logout successfully!");

        await req.user.save();
        res.redirect("/login");

    } catch (error) {
        res.status(500).send(error);
    }
})



// //jsonwebtoken
// const createToken = async()=> {
//     const token= await jwt.sign({_id:"6274aee8c8f75049cc73edb5"}, "secretkey", {expiresIn: "30m"})

//     const userVer= await jwt.verify(token, "secretkey");
// }
// createToken();


app.listen(port);