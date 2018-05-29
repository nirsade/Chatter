import moment from "moment";
import _ from "lodash";
import UsersController from "./controllers/users";
import ChannelsController from "./controllers/channels";

module.exports = app => {
  const usersController = new UsersController(app);
  const channelsController = new ChannelsController(app);

  /**
   * @endpoint: /api/users
   * @method: POST
   **/
  app.post("/api/users", (req, res) =>
    usersController.handleUserRegister(req, res)
  );

  /**
   * @endpoint: /api/users/me
   * @method: GET
   **/
  app.get("/api/users/me", (req, res) =>
    usersController.handleGetUser(req, res)
  );

  /**
   * @endpoint: /api/users/search
   * @method: POST
   **/
  app.post("/api/users/search", (req, res) =>
    usersController.handleSearchUser(req, res)
  );

  /**
   * @endpoint: /api/users/:id
   * @method: GET
   **/
  app.get("/api/users/:id", (req, res) =>
    usersController.handleGetUser(req, res)
  );

  /**
   * @endpoint: /api/users/login
   * @method: POST
   **/
  app.post("/api/users/login", (req, res) =>
    usersController.handleUserLogin(req, res)
  );

  /**
   * @endpoint: /api/me/logout
   * @method: GET
   **/
  app.get("/api/me/logout", (req, res) =>
    usersController.handleUserLogout(req, res)
  );

  /**
   * @endpoint: /api/me/channels
   * @method: GET
   **/
  app.get("/api/me/channels", (req, res) =>
    channelsController.handleGetUserChannels(req, res)
  );

  /**
   * @endpoint: /api/channels/:id
   * @method: GET
   **/
  app.get("/api/channels/:id", (req, res) =>
    channelsController.handleGetChannels(req, res)
  );

  /**
   * @endpoint: /api/channels/:id/messages
   * @method: GET
   **/
  app.get("/api/channels/:id/messages", (req, res) =>
    channelsController.handleGetMessages(req, res)
  );
};
