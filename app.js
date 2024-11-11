const express=require("express");
const app=express();
const path = require("path");
const engine = require("ejs-mate");
const main=require("./init.js");
const MongoStore = require("connect-mongo");
const session =require("express-session");
const passport = require("passport");
const Localstrategy = require("passport-local");
const User=require("./models/user.js");
const methodOverride = require("method-override");
const {guideschema,reviewschema,messageschema}=require("./schema.js");
const guide=require("./models/guidemodel.js");
const review=require("./models/reviews.js");
const message=require("./models/messages.js");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 


app.use(methodOverride("_method"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.engine("ejs", engine);
app.set("viewengine", "ejs");
app.set("views", path.join(__dirname, "views"));

main();
const sessionOptions = {
    store: MongoStore.create({
        mongoUrl: "mongodb://localhost:27017/collegeproject", // Database URL
        touchAfter: 24 * 3600 // Lazy update every 24 hours to reduce session update frequency
    }),                             
    secret:"adheddkhjd" ,        
    resave: false,
    saveUninitialized: true,         
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 3, 
        httpOnly: true,               
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    }
};
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new Localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    
    res.locals.curruser=req.user;
    console.log(res.locals.success);
    console.log("hi");
    next();


});

app.get("/",(req,res)=>{
    res.render("index.ejs");
})
app.get("/guide",async(req,res)=>{
    const model1 = await guide.find({});
    res.render("guides.ejs", { model1 });
})
app.get("/signup",(req,res)=>{
    res.render("userform.ejs");
})
app.get("/signin",(req,res)=>{
    res.render("guidesignin.ejs");
})
app.get("/signup-user",(req,res)=>{
    res.render("userform.ejs");
})
app.get("/newguide",(req,res)=>{
    res.render("new.ejs");
})
app.post("/logup",async (req,res)=>{
    try {
        let { username, email, password } = req.body;
        const newuser = new User({ username, email });
        const registeredUser = await User.register(newuser, password);
        
        req.login(registeredUser,(err)=>{
            if(err){
                console.log(err);
            }
            res.redirect("/");

        });
        
    }
    //res.redirect("/listings");
    catch(e){
        res.redirect("/signup");
    }



});
app.get("/signout",(req,res)=>{
    req.logout((err)=>{
        if(err){
            console.log(err);
        }
        
        res.redirect("/");
    })
});
app.post("/login",passport.authenticate("local",{failureRedirect:"/signin"}),(req,res)=>{
    res.redirect("/");
});

app.post("/postnew",upload.single("hi2[image]"),async(req,res)=>{
    let {errork}=guideschema.validate(req.body);
    if(errork){
       res.send("validation failed");
    }
    else{
        try {
            const url = req.file.path;       // Should work if file is uploaded correctly
            const name = req.file.filename;
            const newguides = new guide(req.body.hi2);
            newguides.owner = req.user._id;
            newguides.image = { url, name };
            console.log(req.file.filename);
            await newguides.save();
            res.redirect('/');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error saving guide enter the details properly');
        }
    
    }




    



});
app.get("/shows/:id",async(req,res)=>{
    let { id } = req.params;
    const k =  await guide.findById(id).populate("reviews").populate("owner");
    for(i of k.reviews){
         await i.populate("author");
    }
   // console.log(k.reviews);
   if(!res.locals.curruser){
    res.send("please sign in or signup to navigate through guides")
   }
   if(res.locals.curruser){
    res.render("show.ejs",{k});

   }
  
    

    
  
    

    

    //res.render("show.ejs",{k});

});
app.post("/reviews/:id",async(req,res)=>{
    console.log(req.body);
    let id=req.params.id;
    console.log(id);
    const lis=await guide.findById(id);
    //console.log(lis);
    const newreview=new review(req.body.review);
    newreview.author=req.user._id;
    console.log(newreview);
    lis.reviews.push(newreview);

    await newreview.save();
    await lis.save();
   
    
    res.redirect(`/shows/${id}`);
    
});
app.post("/message/:id",async(req,res)=>{
    console.log(req.body);
    let id=req.params.id;
    console.log(id);
    const lis=await guide.findById(id);
    //console.log(lis);
    const newmessage=new message(req.body.message);
    newmessage.author=req.user._id;
    
    lis.messages.push(newmessage);

    await newmessage.save();
    await lis.save();
   
    
    res.redirect(`/shows/${id}`);

});
app.get("/summations/:id",async(req,res)=>{
    let { id } = req.params;
    const g =  await guide.findById(id).populate("messages").populate("owner").populate("messages.author");
    for(let i of g.messages){
        await i.populate("author");
    }
    //console.log(g.messages);
    res.render("show2.ejs",{g});
    
    

    
   

});
app.get("/searched",async(req,res)=>{
    const f=req.query.searched;
    const model1= await guide.find({ location: new RegExp(req.query.searched, 'i') });
    res.render("guides.ejs",{model1});
});

app.delete("/delete/:id",async(req,res)=>{
   const {id}=req.params;
   await guide.findByIdAndDelete(id);
   res.redirect("/guide");

})

app.delete("/delete/:id/reviews/:reviewId",async(req,res)=>{
    let {id,reviewId}=req.params;
    await review.findByIdAndDelete(id);
    await guide.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    res.redirect(`/shows/${id}`);
})

app.delete("/emessy/:messageId",async(req,res)=>{
    let {messageId}=req.params;
    const guidek = await guide.findOne({ messages: messageId });
    await message.findByIdAndDelete(messageId);
    res.redirect(`/summations/${guidek._id}`);
    
});

    







app.listen(8080, () => {
    console.log("listening 8080")});
