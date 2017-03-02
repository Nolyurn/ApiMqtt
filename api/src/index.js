import Client from "./Client";
import Admin from "./Admin";
import Moderator from "./Moderator";

exports.testFunc = function () {
    console.log("L'import fonctionne bien.");
};

module.exports.Client = Client;
module.exports.Admin = Admin;
module.exports.Moderator = Moderator;
module.exports.Privilege = Admin.Privilege;
module.exports.Types = Moderator.Types;
