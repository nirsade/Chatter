"use strict";
import _ from "lodash";

export default class ChannelsController {
  constructor(app) {
    // this.app = app;
    this.models = app.models;
  }

  handleGetChannels = function(req, res) {
    const channelId = _.get(req, "params.id");
    if (!channelId) {
      return res.status(404).json({ error: { message: "Not found." } });
    }
    this.models.channel
      .load(channelId)
      .then(channel => {
        const members = channel.members;
        const query = {
          _id: { $in: members }
        };
        const options = { _id: 1, name: 1, created: 1 };
        this.models.user
          .find(query, options)
          .then(users => {
            channel.users = users;
            return res.status(200).json(channel);
          })
          .catch(err => {
            return res.status(404).json({ error: { message: "Not found." } });
          });
      })
      .catch(err => {
        return res.status(404).json({ error: { message: "Not found." } });
      });
  };

  handleGetMessages = function(req, res) {
    let tokenId = req.get("authorization");
    if (!tokenId) {
      tokenId = _.get(req, "query.auth");
    }
    this.models.token
      .loadTokenAndUser(tokenId)
      .then(token => {
        const userId = token.userId;
        // make sure user are logged in
        // check if this user is inside of channel members. other retun 401.
        let filter = _.get(req, "query.filter", null);
        if (filter) {
          filter = JSON.parse(filter);
        }
        const channelId = _.toString(_.get(req, "params.id"));
        const limit = _.get(filter, "limit", 50);
        const offset = _.get(filter, "offset", 0);
        // load channel
        this.models.channel
          .load(channelId)
          .then(c => {
            const memberIds = _.get(c, "members");
            const members = [];
            _.each(memberIds, id => {
              members.push(_.toString(id));
            });

            if (!_.includes(members, _.toString(userId))) {
              return res
                .status(401)
                .json({ error: { message: "Access denied" } });
            }

            this.models.message
              .getChannelMessages(channelId, limit, offset)
              .then(messages => {
                return res.status(200).json(messages);
              })
              .catch(err => {
                return res
                  .status(404)
                  .json({ error: { message: "Not found." } });
              });
          })
          .catch(err => {
            return res.status(404).json({ error: { message: "Not found." } });
          });
      })
      .catch(err => {
        return res.status(401).json({ error: { message: "Access denied" } });
      });
  };

  handleGetUserChannels = function(req, res) {
    let tokenId = req.get("authorization");
    if (!tokenId) {
      // get token from query
      tokenId = _.get(req, "query.auth");
    }
    this.models.token
      .loadTokenAndUser(tokenId)
      .then(token => {
        const userId = token.userId;
        const query = [
          {
            $lookup: {
              from: "users",
              localField: "members",
              foreignField: "_id",
              as: "users"
            }
          },
          {
            $match: {
              members: { $all: [userId] }
            }
          },
          {
            $project: {
              _id: true,
              title: true,
              lastMessage: true,
              created: true,
              updated: true,
              userId: true,
              users: {
                _id: true,
                name: true,
                created: true,
                online: true
              },
              members: true
            }
          },
          {
            $sort: { updated: -1, created: -1 }
          },
          {
            $limit: 50
          }
        ];
        this.models.channel
          .aggregate(query)
          .then(channels => {
            return res.status(200).json(channels);
          })
          .catch(err => {
            return res.status(404).json({ error: { message: "Not found." } });
          });
      })
      .catch(err => {
        return res.status(401).json({
          error: "Access denied"
        });
      });
  };
}
