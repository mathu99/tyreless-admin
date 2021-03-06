var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var crypto = require('crypto');
const fs = require('fs');
var User = require("../models/user");
var Partner = require("../models/partner");
var Tyre = require("../models/tyre");
var Inclusion = require("../models/inclusion");
var PartnerService = require("../models/partnerService");
var PartnerTyre = require("../models/partnerTyre");
var AuditItem = require("../models/auditItem");

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

router.post('/changePassword', function (req, res) {
    if (!req.body.newPassword) {
        res.json({ success: false, msg: 'Please pass new password.' });
    } else {
        var token = getToken(req.headers);
        if (token) {
            var newUser = {
                username: req.body.username,
                password: req.body.newPassword,
                role: req.body.role,
            };
            User.findOne({
                username: newUser.username
            }, function (err, user) {
                if (err) throw err;
                if (!user) {
                    res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
                } else {
                    user.password = newUser.password;
                    user.save(function (err) {
                        if (err) {
                            return res.json({ success: false, msg: err.message });
                        }
                        var token = jwt.sign(user.toJSON(), config.secret); // if user is found and password is right create a token
                        res.json({ success: true, token: 'JWT ' + token });  // return the information including token as JSON
                    });
                    
                }
            });

        } else {
            return res.status(403).send({ success: false, msg: 'Unauthorized.' });
        }
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

router.post('/partner', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        var partner = {
            id: (req.body.id) ? req.body.id : uuidv4(),
            customerCode: req.body.customerCode,
            retailerName: req.body.retailerName,
            registeredName: req.body.registeredName,
            province: req.body.province,
            suburb: req.body.suburb,
            branchName: req.body.branchName,
            branchPin: req.body.branchPin,
            partnerZoneEmail: req.body.partnerZoneEmail,
            salesEmail: req.body.salesEmail,
            logo: req.body.logo,
            status: (req.body.status) ? req.body.status : 'Active',
        };
        var query = {'id': partner.id};
        Partner.findOneAndUpdate(query, partner, {upsert:true, runValidators:true}, function(err, doc){
            if (err) {
                return res.status(500).send({ success: false, msg: 'Save Partner failed. ' + err });
            }
            res.json({ success: true, msg: 'Successful created/updated Partner.' });
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});
router.get('/partnerByEmail', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        var query = {'partnerZoneEmail': req.query.email};
        Partner.findOne(query, function (err, partner) {
            if (err) return next(err);
            res.json(partner);
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.get('/partner', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        Partner.find(function (err, partner) {
            if (err) return next(err);
            res.json(partner);
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.delete('/partner', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        Partner.find({ _id:req.body._id }, err => {
            if (err) return res.json({ success: false, msg: 'Delete Partner failed - could not find by ID' });
        }).remove().exec();
        res.json({ success: true, msg: 'Partner deleted' });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.post('/tyre', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        var tyre ={
            id: (req.body.id) ? req.body.id : uuidv4(),
            vehicleType: req.body.vehicleType,
            brand: req.body.brand,
            runFlat: req.body.runFlat,
            tyreModel: req.body.tyreModel,
            tyreImage: {
                data: req.body.binData.data,
                contentType: req.body.contentType,
            },
            width: req.body.width,
            profile: req.body.profile,
            size: req.body.size,
            speedRating: req.body.speedRating,
        };
        var query = {'id': tyre.id};
        Tyre.findOneAndUpdate(query, tyre, {upsert:true}, function(err, doc){
            if (err) {
                return res.status(500).send({ success: false, msg: 'Save Tyre failed. ' + err });
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

router.get('/allPartnerTyres', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        PartnerTyre.find().populate('userRef').populate('tyreRef').populate('partnerRef').exec((err, partnerTyres) => {
            if (err) return next(err);
            else if (partnerTyres) res.json(partnerTyres)
            else return res.status(200).send({ success: true, noResults: true, msg: 'No Tyres found for this Partner.' });
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.get('/pendingPartnerTyres', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        PartnerTyre.find({modified: true}).populate('userRef').populate('tyreRef').exec((err, partnerTyres) => {
            if (err) return next(err);
            else if (partnerTyres) res.json(partnerTyres)
            else return res.status(200).send({ success: true, noResults: true, msg: 'No pending partner tyres found.' });
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.get('/partnerTyre', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        PartnerTyre.find({ userRef:req.query.userRef }).populate('userRef').populate('tyreRef').exec((err, partnerTyres) => {
            if (err) return next(err);
            else if (partnerTyres) res.json(partnerTyres)
            else return res.status(200).send({ success: true, noResults: true, msg: 'No Tyres found for this Partner.' });
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.delete('/partnerTyre', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        PartnerTyre.find({ _id:req.body._id }, err => {
            if (err) return res.json({ success: false, msg: 'Delete Tyre failed - could not find by ID' });
        }).remove().exec();
        res.json({ success: true, msg: 'Tyre deleted' });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.post('/partnerTyre', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        var partnerTyre = {
            id: (req.body.id) ? req.body.id : uuidv4(),
            userRef: req.body.userRef,
            tyreRef: req.body.tyreRef,
            partnerRef: req.body.partnerRef,
            inclusion: req.body.inclusion,
        };
        if (req.query && req.query.review == 'true') { /* Review deal */
            partnerTyre = req.body;
            partnerTyre.modified = false;
            partnerTyre.status = 'Live';
        } else {
            if (req.body.modified) {
                partnerTyre.modified = req.body.modified;
                partnerTyre.status = 'Pending';
            }
            if (req.body.price) {
                partnerTyre.price = req.body.price;
            }
        }
        var query = {'id': partnerTyre.id};
        PartnerTyre.findOneAndUpdate(query, partnerTyre, {upsert:true, setDefaultsOnInsert: true}, function(err, doc){
            if (err) {
                return res.status(500).send({ success: false, msg: 'Save Partner Tyre failed. ' + err });
            }
            res.json({ success: true, msg: 'Successful created/updated Partner Tyre.' });
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.post('/inclusion', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        var inclusion = {
            id: (req.body.id) ? req.body.id : uuidv4(),
            description: req.body.description,
        };
        var query = {'id': inclusion.id};
        Inclusion.findOneAndUpdate(query, inclusion, {upsert:true}, function(err, doc){
            if (err) {
                return res.status(500).send({ success: false, msg: 'Save Inclusion failed. ' + err });
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

router.get('/allPartnerServices', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        PartnerService.find().populate('partnerRef').populate('userRef').exec((err, partnerServices) => {
            if (err) return next(err);
            else if (partnerServices) res.json(partnerServices)
            else return res.status(200).send({ success: true, noResults: true, msg: 'No Partner Service found.' });
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.get('/partnerServices', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        PartnerService.findOne({ userRef:req.query.userRef }).populate('userRef').exec((err, partnerServices) => {
            if (err) return next(err);
            else if (partnerServices) res.json(partnerServices)
            else return res.status(200).send({ success: true, noResults: true, msg: 'No Partner Service found.' });
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.post('/partnerServices', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        var partnerService = {
            userRef: req.body.userInfo._id,
        };
        if (req.body.partnerRef) {
            partnerService.partnerRef = req.body.partnerRef;
        }
        if (req.query.review != 'true') { /* Submit for review */
            partnerService.wheelAlignmentPrice = req.body.services.wheelAlignmentPrice;
            partnerService.wheelBalancingPrice = req.body.services.wheelBalancingPrice;
            partnerService.reviewPending = true;
        } else {    /* Changes have been reviewed */
            partnerService.liveWheelAlignmentPrice = '' + req.body.services.wheelAlignmentPrice;
            partnerService.liveWheelBalancingPrice = '' + req.body.services.wheelBalancingPrice;
            partnerService.wheelAlignmentPrice = null;
            partnerService.wheelBalancingPrice = null;
            partnerService.reviewPending = false;
        }
        var query = {'userRef': partnerService.userRef};
        PartnerService.findOneAndUpdate(query, partnerService, {upsert:true}, function(err, doc){
            if (err) {
                return res.status(500).send({ success: false, msg: 'Save Serivce failed. ' + err });
            }
            res.json({ success: true, msg: 'Successful created/updated Serivce.' });
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.get('/pendingPartnerServices', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        PartnerService.find({reviewPending: true}).populate('userRef').exec((err, partnerServices) => {
            if (err) return next(err);
            else if (partnerServices) res.json(partnerServices)
            else return res.status(200).send({ success: true, noResults: true, msg: 'No pending partner services found.' });
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.get('/auditItem', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        if (req.query.userRef && req.query.userRef !== undefined) {
            AuditItem.find( { $or:[ {'userRef':req.query.userRef}, {'affectedRef':req.query.userRef} ]}).populate('userRef').populate('affectedRef').exec((err, auditItems) => {
                if (err) return next(err);
                else if (auditItems) res.json(auditItems)
                else return res.status(200).send({ success: true, noResults: true, msg: 'No Audit Items found.' });
            });
        } else {
            AuditItem.find().populate('userRef').populate('affectedRef').exec((err, auditItems) => {
                if (err) return next(err);
                else if (auditItems) res.json(auditItems)
                else return res.status(200).send({ success: true, noResults: true, msg: 'No Audit Items found.' });
            });
        }
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.post('/auditItem', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        var auditItem = new AuditItem({
            description: req.body.description,
            payload: req.body.payload,
            userRef: req.body.userRef,
        });
        if (req.body.affectedRef) {
            auditItem.affectedRef = req.body.affectedRef;
        }
        auditItem.save(function (err) {
            if (err) {
                return res.status(500).send({ success: false, msg: err.message });
            }
            res.json({ success: true, msg: 'Successfully created audit item' });
        });
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