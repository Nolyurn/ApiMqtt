exports.payloadResponse = function (success, token, payload){
	return JSON.stringify({"success":success, "token":`${token}`, "payload":payload})
}