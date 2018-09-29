const express = require("express");
const passport = require('passport');
const router = express.Router();
const User = require("../models/User");
const parser = require('../config/cloudinary');

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;


router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, theUser, failureDetails) => {
        if (err) {
            res.status(500)
                .json({ message: 'Something went wrong authenticating user' });

            return;
        }

        if (!theUser) {
            res.status(401)
                .json(failureDetails);
            return;
        }

        req.login(theUser, (err) => {
            if (err) {
                res.status(500)
                    .json({ message: 'Session save went bad.' });

                return;
            }

            res.status(200)
                .json(theUser);
        });
    })(req, res, next);
});


router.post("/signup", (req, res, next) => {

  const { username, password, campus, course } = req.body;

  if (username === "" || password === "" || campus === "" || course === "") {
    res.status(400)
        .json({message: "Indicate all the necessary data." });

    return;
  }

    if(password.length < 8){
        res.status(400).json({ message: 'Please make your password at least 8 characters long for security purposes.' });
        return;
    }

  User.findOne({ username }, (err, user) => {

      if(err){
          res.status(500)
              .json({message: "Username check went bad."});

          return;
      }

    if (user !== null) {
      res.status(400)
          .json({message: "The username already exists" });

      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      username,
      password: hashPass,
      campus,
      course
    });

    newUser.save()
    .then(() => {

        req.login(newUser, (err) => {

            if (err) {
                res.status(500)
                    .json({ message: 'Login after signup went bad.' });

                return;
            }

            res.status(200)
                .json(newUser);
        });

    })
    .catch(err => {
        res.status(400)
            .json({ message: 'Saving user to database went wrong.' });
    })
  });
});

router.post('/logout', (req, res, next) => {

    req.logout();
    res.status(200)
        .json({ message: 'Log out success!' });
});

router.get('/loggedin', (req, res, next) => {

    if (req.isAuthenticated()) {
        res.status(200)
            .json(req.user);

        return;
    }
    res.status(403)
        .json({ message: 'Unauthorized' });
});

router.post('/upload', parser.single('picture'), (req, res, next) => {
    User.findOneAndUpdate({ username : req.user.username }, { image: req.file.url })
        .then(() => {
            res.json({
                success: true,
                image: req.file.url
            })
        })
});

module.exports = router;
