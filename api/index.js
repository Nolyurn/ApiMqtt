import Client from "modules/Client";
import Admin from "modules/Admin";
import Moderator from "modules/Moderator";

exports.testFunc = function () {
    console.log("L'import fonctionne bien.");
};

exports.Client = Client;
exports.Admin = Admin;
exports.Moderator = Moderator;
