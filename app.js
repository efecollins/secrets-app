//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'Our little secret.', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: [String]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const Users = mongoose.model('User', userSchema);

passport.use(Users.createStrategy());

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username, name: user.displayName });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
},
    function (accessToken, refreshToken, profile, cb) {
        Users.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', passport.authenticate('google', { failureRedirect: '/login' }), function (req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
});

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', (req, res) => {
    const user = new Users({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, err => {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets')
            })
        }
    })
})

app.get('/secrets', (req, res) => {
    Users.find({secret: {$ne: null}}, (err, foundUsers) => {
        if(err) {
            console.log(err)
        } else {
            if(foundUsers) {
                res.render('secrets', {usersWithSecrets: foundUsers})
            }
        }
    })
})

app.get('/submit', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('submit')
    } else {
        res.redirect('/login')
    }
})

app.post('/submit', (req, res) => {
    const submittedSecret = req.body.secret;
    Users.findById(req.user.id, (err, foundUser) => {
        if(err) {
            console.log(err)
        } else {
            if(foundUser) {
                foundUser.secret.push(submittedSecret)
                foundUser.save(() => {
                    res.redirect('/secrets')
                })
            }
        }
    })
})

app.get('/register', (req, res) => {

    res.render('register');
})

app.post('/register', (req, res) => {
    Users.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log(err)
            res.redirect('/register')
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets')
            })
        }
    })
})

app.get('/logout', (req, res) => {
    req.logout(err => { if (err) { console.log(err) } })
    res.redirect('/')
})

app.listen(3001, () => {
    console.log('Server started on port 3001');
})