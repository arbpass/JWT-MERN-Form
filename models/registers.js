//connect with DB and define schema
const mongoose= require("mongoose");
const bcrypt= require("bcryptjs");
const jwt= require("jsonwebtoken");

mongoose.connect("mongodb://localhost:27017/register", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}).then(()=> {
    console.log("connection to database is successfull");
}).catch((e)=> {
    console.log(e);
})

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    registrationNo: {
        type: String,
        required: true,
        unique: true,
    },
    phoneNo: {
        type: Number,
        required: true,
        unique: true,
    },
    course: {
        type: String,
        required: true,
    }, 
    password: {
        type: String,
        required: true,
    
    },
    cpassword: {
        type: String,
        required: true,
    },   
    tokens: [{
        token:{
            type: String,
            required: true,
        }
    }] 
});

//generating tokens
employeeSchema.methods.generateAuthToken= async function(){
    try {
        const token= jwt.sign({_id:this._id.toString()}, process.env.SECRET_KEY, {expiresIn: "30m"}); // unique id is required
        this.tokens= this.tokens.concat({token:token}); //'tokens' is an array, 1st token is var in array, 2nd token is var here
        await this.save();
        return token;
    }
    catch(err){
        console.log(err);
    }
}

//converting password to hash
employeeSchema.pre("save", async function(next){                           //after req.body & before save, we do hashing
    if(this.isModified("password")){                                      //hashing only when password is getting changed
        this.password= await bcrypt.hash(this.password, 10);
        this.cpassword= await bcrypt.hash(this.password, 10);
    }
    next();
})

const Register= new mongoose.model("Register", employeeSchema);

module.exports= Register;