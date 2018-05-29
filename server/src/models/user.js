import _ from "lodash";
import { ObjectID } from "mongodb";
import { OrderedMap } from "immutable";

export default class User {
  constructor(app) {
    this.app = app;
    this.users = new OrderedMap();
  }

  updateUserStatus(userId, isOnline = false) {
    return new Promise((resolve, reject) => {
      // first update status of cache this.users
      this.users = this.users.update(userId, user => {
        if (user) {
          user.online = isOnline;
        }
        return user;
      });

      const query = { _id: new ObjectID(userId) };
      const updater = { $set: { online: isOnline } };
      this.app.db.collection("users").update(query, updater, (err, info) => {
        return err ? reject(err) : resolve(info);
      });
    });
  }

  find(query = {}, options = {}) {
    return new Promise((resolve, reject) => {
      this.app.db
        .collection("users")
        .find(query, options)
        .toArray((err, users) => {
          return err ? reject(err) : resolve(users);
        });
    });
  }

  search(q = "") {
    return new Promise((resolve, reject) => {
      const regex = new RegExp(q, "i");

      const query = {
        $or: [{ nickname: { $regex: regex } }]
      };

      this.app.db
        .collection("users")
        .find(query, {
          _id: true,
          nickname: true,
          created: true
        })
        .toArray((err, results) => {
          if (err || !results || !results.length) {
            return reject({ message: "User not found." });
          }
          return resolve(results);
        });
    });
  }

  login(user) {
    const nickname = _.get(user, "nickname", "");
    const password = _.get(user, "password", "");
    return new Promise((resolve, reject) => {
      this.findUserByNickname(nickname, (err, result) => {
        if (err) {
          return reject({ message: "Nickname is not found" });
        }
        // if found user we have to compare the password hash and plain text.
        const databasePassword = _.get(result, "password");       
        const isMatch = _.isEqual(password, databasePassword);
        if (!isMatch) {
          return reject({ message: "Password is not correct" });
        }
        // user login successful let creat new token save to token collection.
        const userId = result._id;
        this.app.models.token
          .create(userId)
          .then(token => {
            token.user = result;
            return resolve(token);
          })
          .catch(err => {
            return reject({ message: "Login error" });
          });
      });
    });
  }

  findUserByNickname(nickname, callback = () => {}) {
    this.app.db.collection("users").findOne({ nickname }, (err, result) => {
      if (err || !result) {
        return callback({ message: "User not found." });
      }
      return callback(null, result);
    });
  }

  load(id) {
    id = `${id}`;
    return new Promise((resolve, reject) => {
      // find in cache if found we return and dont nee to query db
      const userInCache = this.users.get(id);
      if (userInCache) {
        return resolve(userInCache);
      }
      // if not found then we start query db
      this.findUserById(id, (err, user) => {
        if (!err && user) {
          this.users = this.users.set(id, user);
        }
        return err ? reject(err) : resolve(user);
      });
    });
  }

  findUserById(id, callback = () => {}) {
    if (!id) {
      return callback({ message: "User not found" }, null);
    }
    const userId = new ObjectID(id);
    this.app.db.collection("users").findOne({ _id: userId }, (err, result) => {
      if (err || !result) {
        return callback({ message: "User not found" });
      }
      return callback(null, result);
    });
  }

  beforeSave(user, callback = () => {}) {
    // first is validate user object before save to user collection.
    let errors = [];
    if (_.get(user, "nickname", "").length === 0) {
      errors.push("Nickname is required");
    }
    if(_.get(user, "password", "").length < 4) {
      errors.push("Password is required and more than 3 characters");
    }
    if (errors.length) {
      const err = _.join(errors, ", ");
      return callback(err, null);
    }

    // check nickname is exist in db or not
    const nickname = _.toLower(nickname);

    this.app.db.collection("users").findOne({ nickname }, (err, result) => {
      if (err || result) {
        return callback({ message: "Nickname is already exist" }, null);
      }

      // return callback with succes checked.
      const password = _.get(user, "password");

      const userFormatted = {
        nickname: `${_.trim(_.get(user, "nickname"))}`,
        password: password,
        created: new Date()
      };
      return callback(null, userFormatted);
    });
  }

  create(user) {
    const db = this.app.db;
    return new Promise((resolve, reject) => {
      this.beforeSave(user, (err, user) => {
        if (err) {
          return reject(err);
        }
        // insert new user object to users collections
        db.collection("users").insertOne(user, (err, info) => {
          // check if error return error to user
          if (err) {
            return reject({ message: "An error saving user." });
          }
          // otherwise return user object to user.
          const userId = _.get(user, "_id").toString(); // this is OBJET ID
          this.users = this.users.set(userId, user);
          return resolve(user);
        });
      });
    });
  }
}
