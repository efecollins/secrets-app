//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const Users = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', (req, res) => {
    Users.findOne({ email: req.body.username }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                bcrypt.compare(req.body.password, foundUser.password, function (err, result) {
                    if (result === true) {
                        res.render('secrets');
                    }
                });
            }
        }
    })
})

app.get('/register', (req, res) => {
    res.render('register');
})

app.post('/register', (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const newUser = new Users({
            email: req.body.username,
            password: hash
        })

        newUser.save(err => {
            if (err) {
                console.log(err);
            } else {
                res.render('secrets');
            }
        })
    });
})

app.listen(3000, () => {
    console.log('Server started on port 3000');
})