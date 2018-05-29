"use strict";
import _ from "lodash";

export default class UsersController {
  constructor(app) {
    // this.app = app;
    this.models = app.models;
  }

  handleUserRegister = function(req, res) {
    const body = _.get(req, "body");
    this.models.user
      .create(body)
      .then(user => {
        _.unset(user, "password");
        return res.status(200).json(user);
      })
      .catch(err => {
        return res.status(503).json({ error: "error handler" });
      });
  };

  handleGetUser = function(req, res) {
    let tokenId = req.get("authorization");
    if (!tokenId) {
      tokenId = _.get(req, "query.auth");
    }
    this.models.token
      .loadTokenAndUser(tokenId)
      .then(token => {
        _.unset(token, "user.password");
        return res.json(token);
      })
      .catch(err => {
        return res.status(401).json({
          error: err
        });
      });
  };

  handleSearchUser = function(req, res) {
    const keyword = _.get(req, "body.search", "");
    this.models.user
      .search(keyword)
      .then(results => {
        return res.status(200).json(results);
      })
      .catch(err => {
        return res.status(404).json({
          error: "Not found"
        });
      });
  };

  handleGetUser = function(req, res) {
    const userId = _.get(req, "params.id");
    this.models.user
      .load(userId)
      .then(user => {
        _.unset(user, "password");
        return res.status(200).json(user);
      })
      .catch(err => {
        return res.status(404).json({
          error: err
        });
      });
  };

  handleUserLogin = function(req, res) {
    const body = _.get(req, "body");
    this.models.user
      .login(body)
      .then(token => {
        _.unset(token, "user.password");
        return res.json(token);
      })
      .catch(err => {
        return res.json({
          error: err
        });
      });
  };

  handleUserLogout = function(req, res) {
    let tokenId = req.get("authorization");
    if (!tokenId) {
      // get token from query
      tokenId = _.get(req, "query.auth");
    }
    this.models.token
      .loadTokenAndUser(tokenId)
      .then(token => {
        this.models.token.logout(token);
        return res.status(200).json({
          message: "Successful."
        });
      })
      .catch(err => {
        return res.status(401).json({ error: { message: "Access denied" } });
      });
  };
}
