const app = require('./app')

const port = process.env.PORT//env: envirnoment variable we access the environment variable which is provided by heroku when heroku runs our node application 


app.listen(port, () => {
    console.log('Serve is up on port ' + port)
})

