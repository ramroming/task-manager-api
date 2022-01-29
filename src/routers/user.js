const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middlware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail } = require('../emails/account')
const { sendGoodbyeEmail } = require('../emails/account')

// ************************************ for users *******************************

//to add/sign up a user
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

//to login a user
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})



//to log out a user
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token //if they aren't equal then we keep the token because it's not the one we want to delete from the tokens array since we are logging out
            //so this filter method is working like this: filter out the token when there's a match to it in the array of tokens
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})


//to log out of all sessions
router.post('/users/logoutAll', auth, async (req, res) => {
    try {

        req.user.tokens = []

        await req.user.save() 
        res.status(200).send()
    } catch (e) {
        res.status(500).send()

    }
})

// to get the profile of the user

router.get('/users/me', auth, async (req,res) => {
    res.send(req.user)
})

// to update a user
router.patch('/users/me' , auth, async (req, res) => {
    const updates = Object.keys(req.body) //takes the object and keys will return an array of strings where each is a property on this object ex: "name", "age", "height".. etc
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update)) // run this function for every item in the array
   if (!isValidOperation){
       return res.status(400).send({'error' : 'invalid updates!'})
   }

    try {
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new : true, runValidators: true}) 
        //the code above bypasses middleware function "pre" in the user model

         updates.forEach((update) =>  req.user[update] = req.body[update] )// we don't use .update here because it's going to change
         await req.user.save()
         res.send(req.user)

    } catch (e) {
        res.status(400).send(e)
    }
})

// to delete a user
router.delete('/users/me',auth,  async (req, res) => {
    try {
        await req.user.remove()
        sendGoodbyeEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

// to upload avatar

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|png|jpeg)$/)){ //if things go wrong
            return cb(new Error('File must be an image!'))
        }
        return cb(undefined, true) //if things go well
    }
})

//the path, make sure they're authenticated, validate and accept the file uploaded, send back the success message, and finally handle any error 
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
   
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer() //pass the data to sharp modify it and ask the data back
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// to delete an avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

//fetching an avatar and getting the image back
router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) { //when things go wrong
            throw new Error()
        }

        //when things go well
        res.set('Content-Type', 'image/png')

        //send the data back
        res.send(user.avatar)

    } catch (e) {
        res.status(404).send()
    }
})
module.exports = router