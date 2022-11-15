//jshint esversion:6
require('dotenv').config();
const express= require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const Users = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', (req, res) => {
    Users.findOne({email: req.body.username}, (err, foundUser) => {
        if(err) {
            console.log(err);
        } else {
            if(foundUser) {
                if(foundUser.password === req.body.password) {
                    res.render('secrets');
                }
            }
        }
    })
})

app.get('/register', (req, res) => {
    res.render('register');
})

app.post('/register', (req, res) => {
    const newUser = new Users({
        email: req.body.username,
        password: req.body.password
    })

    newUser.save(err => {
        if(err) {
            console.log(err);
        } else {
            res.render('secrets');
        }
    })
})

app.listen(3000, () => {
    console.log('Server started on port 3000');
})