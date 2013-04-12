var webinosScriptPath = './webinos.js'; // Precompiled widget

// Adds a script reference to the head and calls the fnc when the script is loaded
function AddScript(src, fnc) {
    var oScript = document.createElement('script');
    oScript.type = 'text/javascript';
    oScript.src = src;
    // most browsers
    oScript.onload = fnc;
    // IE 6 & 7
    oScript.onreadystatechange = function () {
        if (this.readyState == 'complete') {
            fnc();
        }
    }
    document.getElementsByTagName("head")[0].appendChild(oScript);
}

// A function to wait on android for webinos socket to appear
// and inject the webinos.js file (to support browsers)
function initWebinos(callbackFn) {
    if (window.WebSocket || window.MozWebSocket) {
        //Native websocket found.
        AddScript(webinosScriptPath, function(){webinosLoaded(callbackFn);});
    }
    else {
        if (typeof WebinosSocket == 'undefined') {
            //WebinosSocket is undefined! Waiting for it to appear
            setTimeout(initWebinos, 1);
        }
        else {
            //WebinosSocket is defined!
            AddScript(webinosScriptPath, function(){webinosLoaded(callbackFn);});
        }
    }
}

function GetPzhHost(data){
    var output = '';
    // If the information is there
    if (data && data.payload && data.payload.message && data.payload.message.connectedPzh && data.payload.message.connectedPzh.length>0){
        output = data.payload.message.connectedPzh[0];
        if (output.indexOf("_")>0){
            output = output.split("_")[0];
        }
    }
    return output;
}

function webinosLoaded(callbackFn){
    if (typeof(callbackFn) == "function"){ //If we do care to be notified when webinos is loaded
        // Wait for webinos to initialize
        webinos.session.addListener('registeredBrowser', function (data) {
            switch (data.payload.message.state.hub) {         
                case "not_connected":
                    // not connected to hub
                    callbackFn({pzhExists: false,pzhName: ''});
                    break;
                case "connected":
                    // connected to hub
                    var pzhHost = GetPzhHost(data);
                    if (pzhHost.length==0) // If we failed to recognize a pzh
                        pzhHost = data.from; // Set it to the name of the incoming message
                    callbackFn({pzhExists: true,pzhName: pzhHost});
                    break;
            }
        });
        if(webinos.session.getSessionId()!=null){ //If the webinos has already started, force the registerBrowser event
            webinos.session.message_send({type: 'prop', payload: {status:'registerBrowser'}});
        }
    }
}