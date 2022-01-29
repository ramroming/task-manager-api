const sgMail = require('@sendgrid/mail') //require the sendgrid module to use it to send emails



sgMail.setApiKey(process.env.SENDGRID_API_KEY) //use the api we have with the sendgrid module 
//when we send an email sendgrid will know it's associated with our account


// //to send an individual email
// sgMail.send({
//     to: 'reemalhalbouni@hotmail.com',
//     from: 'rimhalbuni@hotmail.com',
//     subject: 'This is my first email!!!!',
//     text: 'I am so happy I\'m doing something new :)',
// })


const appEmail = 'rimhalbuni@hotmail.com'

//create a function that will be exported from the file
const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: appEmail, //the custom domain but for now an email would work fine!
        subject: 'Welcome to the app! :)',
        html: `Welcome to the app,<strong> ${name}</strong>.<br> Let me know how you get along with the app.`, //use name attribute only with template strings
    })
}

const sendGoodbyeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: appEmail,
        subject: 'Sorry to see you go.. :\'(',
        html: `It's really sad to see you go<strong> ${name}</strong>!<br> Feel free to tell me what went wrong :)`
    }) 
}

module.exports = ({
    sendWelcomeEmail,
    sendGoodbyeEmail
})