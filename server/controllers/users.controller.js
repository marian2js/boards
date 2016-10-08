const jwt = require('express-jwt');

const config = require('config');
const User = require('../models/user.model');
const Board = require('../models/board.model');
const Team = require('../models/team.model');
const UserErrors = require('errors/user.errors');
const Logger = require('utils/logger');
const logger = new Logger('Users Controller');

module.exports = {

  /**
   * Get data from an user by ID
   */
  getUserById(req, res) {
    res.send(req.user.getReadableData());
  },

  /**
   * Update user by ID
   */
  updateUserById(req, res) {
    logger.debug('Updating user with data:', req.body);

    req.user.setEditableData(req.body);
    return req.user.save()
      .then(() => {
        logger.info(`User ID "${req.user.id}" updated`);
        res.send(req.user.getReadableData());
      })
      .catch(err => next(new UserErrors.UnknownUserError(err.message || err)));
  },

  /**
   * Get an array with the boards of an user
   */
  getUserBoards(req, res, next) {
    Board.findByUserId(req.user.id)
      .then(boards => {
        let boardsData = boards.map(board => board.getReadableData());
        res.send(boardsData);
      })
      .catch(err => next(new UserErrors.UnknownUserError(err.message || err)));
  },

  /**
   * Get an array with the teams of an user
   */
  getUserTeams(req, res, next) {
    Team.findByUserId(req.user.id)
      .then(teams => {
        let teamsData = teams.map(team => team.getReadableData());
        res.send(teamsData);
      })
      .catch(err => next(err || new UserErrors.UnknownUserError()));
  },

  /**
   * Request an access token with a secret code
   */
  requestAccessToken(req, res, next) {
    User.findById(req.params.userId)
      .then(user => {
        if (!user) {
          return next(new UserErrors.UserNotFoundError(req.params.userId));
        }
        return user.getAccessToken(req.query.code)
      })
      .then(accessToken => {
        if(accessToken) {
          res.send({ access_token: accessToken });
        } else {
          next(new UserErrors.InvalidRequestAccessTokenCodeError());
        }
      })
      .catch(err => next(new UserErrors.UnknownUserError(err.message || err)));
  },

  /**
   * Middleware for validating user's access token
   */
  validateAuth(req, res, next) {
    if (req.path.split('/')[3] === 'request_access_token') {
      req.skip_auth = true;
      return next();
    }
    jwt({ secret: config.secrets.jwt })(req, res, () => {
      if (!req.user || !req.user.id) {
        return next(new UserErrors.InvalidAccessTokenError());
      }
      User.findById(req.user.id)
        .then(user => {
          if (user) {
            req.user = user;
            next();
          } else {
            next(new UserErrors.UserNotFoundError(req.user.id));
          }
        })
        .catch(err => next(new UserErrors.UnknownUserError(err.message || err)));
    });
  },

  /**
   * Verifies if the logged user has permissions to use the endpoint
   */
  verifyPermissions(req, res, next) {
    let userId = req.path.split('/')[1];
    if (req.skip_auth || req.user.id === userId) {
      return next();
    }
    next(new UserErrors.UnauthorizedUserError());
  }

};