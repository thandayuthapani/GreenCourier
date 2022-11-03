
module.exports = {
    responseError(res, err) {
        console.error(err);
        res.status(400).json(err);
    },

    responseSystemError(res, err) {
        console.error(err);
        res.status(500).json({ message: "Something went wrong" });
    },

    genericResponse(res, errName, errMessage, errCode) {
        res.status(errCode).json({name: errName, errors: [{message: errMessage}]});
    },

    dashboardResponse(res, token, errStatus='', errMessage='', errReason='', errCode=200)
    {
        
        if(errCode === 200 && token !== '')
        {
            console.log("[UserController] We found token for Kube Dashboard")
            res.status(errCode).json({
                caps_token: token,
                errors: []
            });
        }else{
            console.error("[UserController] Request from Kube Dashboard Failed!")
            res.status(200).json({
                caps_token: token,
                errors: [{ErrStatus: {
                  status: errStatus,
                  message: errMessage,
                  reason: errReason,
                  code: errCode
                }}]
              });
        }
        
    },
    consoleLog(fileName, fileFunction, fileFocus, logMessage)
    {
        console.log(`[${fileName}]=>[${fileFunction}]->[${fileFocus}]: ${logMessage}`);
    }
}
