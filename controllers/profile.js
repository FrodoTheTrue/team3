'use strict';

const async = require('async');

const userModel = require('../models/user');
const questModel = require('../models/quest');

const fs = require('fs');
const handlebars = require('hbs').handlebars;
const layouts = require('handlebars-layouts');
handlebars.registerHelper(layouts(handlebars));
handlebars.registerPartial('base', fs.readFileSync('./views/base.hbs', 'utf8'));

exports.getProfile = (req, res, next) => {
    var userID = req.params.id;
    async.waterfall([
        done => {
            userModel
                .findUser(JSON.stringify({_id: {$oid: userID}}))
                .then(result => {
                    if (result.message.length) {
                        res.redirect('');
                        return;
                    }
                    done(null, result.user);
                })
                .catch(err => {
                    done(err);
                });
        },
        (user, done) => {
            var questLists = [user.myQuests, user.passedQuests, user.wishList];
            var promises = [];
            questLists.forEach(list => {
                promises.push(questModel.getSomeQuests(list));
            });
            Promise
                .all(promises)
                .then(result => {
                    var profileInfo = {
                        id: userID,
                        nickname: user.nickname,
                        city: user.city,
                        avatar: user.avatar,
                        myQuests: getQuestsInfo(result[0]),
                        passedQuests: getQuestsInfo(result[1]),
                        wishList: getQuestsInfo(result[2]),
                        markers: JSON.stringify(user.markers),
                        currentUserID: req.user
                    };
                    done(null, profileInfo);
                })
                .catch(err => {
                    done(err);
                });
        },
        (result, done) => {
            var isCurrent = req.user === result.id ? {isCurrentUser: true} : {isCurrentUser: false};
            result = Object.assign(result, isCurrent);
            var templ = handlebars.compile(fs.readFileSync('./views/profile/profile.hbs', 'utf8'));
            res.send(templ(Object.assign(result, req.commonData)));
            done(null);
        }
    ], err => {
        err ? next(err) : next();
    });
};

/* exports.editProfile = (req, res) => {

};

exports.updateProfile = (req, res) => {

};*/

function getQuestsInfo(list) {
    var result = [];
    list.forEach(element => {
        result.push({
            questSlug: element.slug,
            questName: element.displayName,
            questTitlePhoto: element.titleImage,
            questDescription: element.description
        });
    });
    return result;
}
