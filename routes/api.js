var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var crypto = require('crypto');
var User = require("../models/user");
var Book = require("../models/book");
var Partner = require("../models/partner");
var Tyre = require("../models/tyre");
var Inclusion = require("../models/inclusion");

/* GET home page. */
router.get('/', function (req, res, next) {
    res.send('Express RESTful API');
});

router.post('/signup', function (req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({ success: false, msg: 'Please pass username and password.' });
    } else {
        var newUser = new User({
            username: req.body.username,
            password: req.body.password,
            role: req.body.role,
        });
        // save the user
        newUser.save(function (err) {
            if (err) {
                return res.json({ success: false, msg: err.message });
            }
            res.json({ success: true, msg: 'Successful created new user.' });
        });
    }
});

router.post('/signin', function (req, res) {
    User.findOne({
        username: req.body.username
    }, function (err, user) {
        if (err) throw err;

        if (!user) {
            res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
        } else {
            console.log(user)
            // check if password matches
            user.comparePassword(req.body.password, function (err, isMatch) {
                if (isMatch && !err) {
                    // if user is found and password is right create a token
                    var token = jwt.sign(user.toJSON(), config.secret);
                    // return the information including token as JSON
                    res.json({ success: true, token: 'JWT ' + token });
                } else {
                    res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' });
                }
            });
        }
    });
});

router.get('/user', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        return res.json(jwt.decode(token, config.secret));
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.post('/book', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        var newBook = new Book({
            isbn: req.body.isbn,
            title: req.body.title,
            author: req.body.author,
            publisher: req.body.publisher
        });

        newBook.save(function (err) {
            if (err) {
                return res.json({ success: false, msg: 'Save book failed.' });
            }
            res.json({ success: true, msg: 'Successful created new book.' });
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.get('/book', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        Book.find(function (err, books) {
            if (err) return next(err);
            res.json(books);
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});


router.post('/partner', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        var partner = new Partner({
            customerCode: (req.body.customerCode) ? req.body.customerCode : uuidv4(),
            retailerName: req.body.retailerName,
            registeredName: req.body.registeredName,
            province: req.body.province,
            suburb: req.body.suburb,
            branchName: req.body.branchName,
            branchPin: req.body.branchPin,
            partnerZoneEmail: req.body.partnerZoneEmail,
            salesEmail: req.body.salesEmail,
            status: 'Active'
        });
        var query = {'customerCode': partner.customerCode};
        partner.findOneAndUpdate(query, partner, {upsert:true}, function(err, doc){
            if (err) {
                return res.json({ success: false, msg: 'Save Partner failed.' + err });
            }
            res.json({ success: true, msg: 'Successful created/updated Partner.' });
        });
        /*partner.save(function (err) {
            if (err) {
                return res.json({ success: false, msg: 'Save Partner failed.' });
            }
            res.json({ success: true, msg: 'Successful created/updated Partner.' });
        });*/
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.get('/partner', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        Partner.find(function (err, books) {
            if (err) return next(err);
            res.json(books);
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.post('/tyre', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        var tyre = new Tyre({
            vehicleType: req.body.vehicleType,
            brand: req.body.brand,
            logo: req.body.logo,
            tyreModel: req.body.tyreModel,
            tyreImage: req.body.tyreImage,
            width: req.body.width,
            profile: req.body.profile,
            size: req.body.size,
            speedRating: req.body.speedRating,
        });

        tyre.save(function (err) {
            if (err) {
                return res.json({ success: false, msg: 'Save Tyre failed.' });
            }
            res.json({ success: true, msg: 'Successful created/updated Tyre.' });
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.get('/tyre', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        Tyre.find(function (err, tyres) {
            if (err) return next(err);
            res.json(tyres);
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.delete('/tyre', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        Tyre.find({ _id:req.body._id }, err => {
            if (err) return res.json({ success: false, msg: 'Delete Tyre failed - could not find by ID' });
        }).remove().exec();
        res.json({ success: true, msg: 'Tyre deleted' });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.post('/inclusion', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        var inclusion = new Inclusion({
            description: req.body.description,
        });

        inclusion.save(function (err) {
            if (err) {
                return res.json({ success: false, msg: 'Save Inclusion failed.' });
            }
            res.json({ success: true, msg: 'Successful created/updated Inclusion.' });
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.get('/inclusion', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        Inclusion.find(function (err, inclusions) {
            if (err) return next(err);
            res.json(inclusions);
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.delete('/inclusion', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        Inclusion.find({ _id:req.body._id }, err => {
            if (err) return res.json({ success: false, msg: 'Delete Inclusion failed - could not find by ID' });
        }).remove().exec();
        res.json({ success: true, msg: 'Inclusion deleted' });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

getToken = function (headers) {
    if (headers && headers.authorization) {
        var parted = headers.authorization.split(' ');
        if (parted.length === 2) {
            return parted[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
};

module.exports = router;