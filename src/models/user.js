const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema( {
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0){
                throw new Error('Age must be a positive number!')
            }
        }
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is not valid!')
            }
        },
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Password cannot be password!!')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

//to set a relatiohship between two entities / a way for mongoose to know how to deal with the relationship
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})


//to get public profile of a single user
userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()
    // console.log(user) the things that caused lagging in postman
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

//to generate a token to a single user
userSchema.methods.generateAuthToken = async function() { //instance methods
    const user = this
    const token = jwt.sign( { _id : user._id.toString()} , process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}


userSchema.statics.findByCredentials = async (email, password) => { //model methods
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login!')
    }

    const isMatch = await bcrypt.compare(password, user.password) //first parameter is the entered plain text password, second is the hashed password in the database

    if (!isMatch) {
        throw new Error('Unable to login!')
    }

    return user
}

//Hash the plain text password before saving
userSchema.pre('save', async function(next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()

}) //before saving

//middleware to delete user's tasks when the user is deleted
userSchema.pre('remove', async function (next){
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User', userSchema)


module.exports = User