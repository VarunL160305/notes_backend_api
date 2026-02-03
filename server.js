const express=require('express');
const rateLimit=require('express-rate-limit');
const mongoose=require('mongoose');
const joi=require('joi');
const methodOverride=require('method-override')

const app=express();
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'))

mongoose.connect('mongodb://localhost:27017/Notes_DB')
.then(()=>{
    console.log("Successful connected to DB")
})
.catch(()=>{
    console.log("Connection Failed")
})

const notesSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true,
        minlength:1
    },
    content:{
        type:String,
        required:true,
        trim:true,
        minlength:1
    }
},{
    timestamps:{createdAt:'created_at',updatedAt:'updated_at'}
});

const Note=mongoose.model('Note',notesSchema);


//ErrorClass
class ExpressError extends Error{
    constructor(status,message){
        super(message);
        this.status=status;
    }
}

// RateLimiting 
const noteRateLimiter=rateLimit({
    windowMs:60*1000,
    max:5,
    message:{
        error:"Too many note creation, Wait for some time"
    }
});

//joi validation for creation and updation
const createValidation=joi.object({
    title:joi.string().trim().min(1).required(),
    content:joi.string().trim().min(1).required(),
})

const updateValidation=joi.object({
    title:joi.string().trim().min(1),
    content:joi.string().trim().min(1)
}).min(1)

//routes
app.get('/notes',async(req,res,next)=>{
    try{
        const data=await Note.find().sort({updated_at:-1})
        res.send(data)
    }
    catch(e){
        return next(new ExpressError(500,'Internal Server Error'))
    }
})

app.post('/notes',noteRateLimiter,async(req,res,next)=>{
    const {error,value}=createValidation.validate(req.body);
    if(error){
        return next(new ExpressError(400,error.details[0].message))
    }
    try{
        const note =new Note(value)
        await note.save()
        res.status(201).send("note created successfully")
    }catch(e){
        return next(new ExpressError(500,'Internal Server Error'))
    }
})

app.get('/notes/search',async(req,res,next)=>{
    const {q}=req.query;
    
    if(!q || q.trim().length===0){
        return next(new ExpressError(400,'search field can not be empty'))
    }
    const search=q.trim()
    try{
        const regex=new RegExp(search,'i')
        const notes=await Note.find({$or:[{title:regex},{content:regex}]}).sort({updated_at:-1})
        res.status(200).send(notes)
    }catch(e){
        next(new ExpressError(500, "Internal Server Error"))
    }
})

app.put('/notes/:id',async(req,res,next)=>{
    const {error,value}=updateValidation.validate(req.body);
    if(error){
        return next(new ExpressError(400,error.details[0].message))
    }
    try{
        const {id}=req.params
        const noteId=await Note.findById(id)
        if(!noteId){
            return next(new ExpressError(404,"Note not found"))
        }

        if((value.title===noteId.title || value.title===undefined)&&(value.content===noteId.content || value.content===undefined)){
            return res.status(200).send("No changes found")
        }

        const updateNote=await Note.findByIdAndUpdate(id,value,{new:true,runValidators:true})
        res.status(200).send('Note updated successfully')
    }catch(e){
        return next(new ExpressError(500,'Internal Server Error'))
    }
})


app.use((err,req,res,next)=>{
    const {status=500,message='Internal Server Error'}=err
    res.status(status).send(message)
})

app.listen(3000,()=>{
    console.log("App running on port 3000")
})