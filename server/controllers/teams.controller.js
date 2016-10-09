const Team = require('models/team.model');
const User = require('models/user.model');
const TeamErrors = require('errors/team.errors');
const UserErrors = require('errors/user.errors');
const Logger = require('utils/logger');
const logger = new Logger('Team Controller');

module.exports = {

  createTeam(req, res, next) {
    logger.debug('Creating team with data:', req.body);

    let team = new Team();
    team.addUser(req.user);
    team.setEditableData(req.body);
    return team.save()
      .then(() => {
        logger.info(`Team "${team.name}" created`);
        res.send(team.getReadableData());
      })
      .catch(err => next(err || new TeamErrors.UnknownTeamError()));
  },

  /**
   * Get data from a team by ID
   */
  getTeamById(req, res) {
    let query = {
      _id: {
        $in: req.team.users.map(u => u.user)
      }
    };
    User.find(query)
      .then(users => {
        let teamData = req.team.getReadableData();
        teamData.users = teamData.users
          .map(user => {
            let teamUser = user.toObject();
            let userData = users.find(u => user.user.toString() === u._id.toString());
            if (userData) {
              teamUser.user = userData.getReadableData();
            }
            return teamUser;
          });
        res.send(teamData);
      })
      .catch(err => next(err || new TeamErrors.UnknownTeamError()));
  },

  /**
   * Update team by ID
   */
  updateTeamById(req, res, next) {
    logger.debug('Updating team with data:', req.body);

    req.team.setEditableData(req.body);
    return req.team.save()
      .then(() => {
        logger.info(`Team "${req.team.name}" updated`);
        res.send(req.team.getReadableData());
      })
      .catch(err => next(err || new TeamErrors.UnknownTeamError()));
  },

  /**
   * Add an user to a team by ID
   */
  addUser(req, res, next) {
    logger.debug(`Adding user to team "${req.team.id}"`);

    let query = {};
    let queryUser = req.body.user || '';

    queryUser = queryUser
      .toLowerCase()
      .trim();
    if (queryUser.includes('@')) {
      query.email = queryUser;
    } else {
      query.username = queryUser;
    }
    User.findOne(query)
      .then(user => {
        if (!user) {
          return next(new UserErrors.UserNotFoundError());
        }
        req.team.addUser(user);
        return req.team.save();
      })
      .then(() => {
        logger.info(`User added to team "${req.team.id}"`);
        res.send(req.team.getReadableData());
      })
      .catch(err => next(err || new TeamErrors.UnknownTeamError()));
  },

  /**
   * Verifies if the logged user has permissions to use the endpoint
   */
  verifyPermissions(req, res, next) {
    let teamId = req.path.split('/')[1];
    if (!teamId) {
      return next();
    }
    Team.verifyPermissions(teamId, req.user.id)
      .then(data => {
        req.team = data.team;
        next();
      })
      .catch(err => next(err || new TeamErrors.UnknownTeamError()));
  }

};