import {Client} from "./Client";
import {Admin, Privilege} from "./Admin";
import {Moderator, Types} from "./Moderator";


exports.testFunc = function () {
    console.log("L'import fonctionne bien.");
};

module.exports = {
    Client : Client,
    Admin : Admin,
    Moderator : Moderator,
    Privilege : Privilege,
    Types : Types
};
