const request = require('supertest')
const app = require('../src/app')
// const User = require('../src/models/user')
const { User, userOneId, userOne, setupDatabase } = require('./fixtures/db')

//the function in here runs before each test case in this file
beforeEach(setupDatabase)

test('Should sign up new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Rawan',
        email: 'rawan@hotmail.com',
        password: '12345hello'
    }).expect(201)

    //Assert that the database was changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull() //expecting the user not to be null (the user has been signed up)

    //Assersion about the response
    expect(response.body).toMatchObject({
        user : {
            name: 'Rawan',
            email: 'rawan@hotmail.com'
        },
        token: user.tokens[0].token
    })
    expect(user.password).not.toBe('12345hello')
})

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(response.body.user._id)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login nonexistent user', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: 'hello19282'
    }).expect(400)
})

//when getting the profile of a user while authenticated 
test('Should get profile for user', async () => {
    await request(app)
    .get('/users/me')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

//when getting the profile of a user while NOT authenticated  
test('Should not get profile for unauthenticated user', async () => {
    await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

//when deleting the account of a user while authenticated
test('Should delete an account for user', async () => {
     await request(app)
    .delete('/users/me')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    //asserting that the user has been deleted 
    const user = await User.findById(userOneId)
    expect(user).toBeNull()

})
//when deleting the account of a user while NOT authenticated 
test('Should not delete an account for user', async () => {
    await request(app)
    .delete('/users/me')
    .send() 
    .expect(401)
})

//when uploading an avatar by a user
test('Should upload avatar image', async () => {
    await request(app)
    .post('/users/me/avatar')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg') //the first argument is the form field we are trying to set
    //the second is the path to the file starts from the root of the project
    .expect(200)

    //assertions
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer)) //toEqual doesn't use === 
    //expect.any :expects the data to be of a certain type
}) 

//when updating valid fields of the user 
test('Should update valid user fields', async () => {
    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        name: 'Mike Myres'
    })
    .expect(200)
    
    //Assertions
    const user = await User.findById(userOneId)
    expect(user.name).toEqual('Mike Myres')
})

//when updating UNVALID fields of the user 
test('Should not update user fields', async () => {
    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        location: 'London'
    })
    .expect(400)

})


