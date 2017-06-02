const brandName = 'iTake';


var port;
var serverToken;
var connected = false;
const methods = {};
init();
chrome.runtime.onConnect.addListener(function(p){
    port = p;
    port.onMessage.addListener(function(msg, sender){console.log([msg, sender]);});
    port.postMessage({'method': 'ping'});
    /*any initialization config or verification of correctness of functionality should occur here*/
});
chrome.contextMenus.create(
    {
        title: brandName,
        contexts: ['image', 'video'],
        onclick: getContentData
    }
);

function getContentData(menuContext, item){
    let mediaItem = {
        media_type: menuContext.mediaType,
        src: menuContext.srcUrl || item.url,
        height: item.height || null,
        width: item.width || null,
        title: (menuContext.srcUrl || item.url).split('/').pop() || null
    };
    port.postMessage({method: 'getTags', data: {mediaItem: mediaItem, token: serverToken}});
}

function init(){
    chrome.storage.sync.get(null, handshake);
}

function handshake(data){
    if(data && data.username && data.password && data.hostname){
        let hed = new Headers({'Content-Type': 'application/json'});
        let req = new Request(
            `${data.hostname}${data.port ? ':' + data.port.toString() : ''}/handshake`,
            {
                cache: 'no-cache',
                headers: hed,
                method: 'GET',
                mode: 'cors'
            }
        );
        fetch(req).then(handshakeResponse);
    }else{
        chrome.runtime.openOptionsPage();
    }
}

function handshakeResponse(response){
    if(response.ok){
        connected = true;
        serverToken = response.json.token;
        document.cookie = `glom_credentials=${serverToken}; max-age=604800; path=/;secure`;
        //this is a problem
        document.cookie = `glom_user=${}`;
    }else{
        console.log(response);
        chrome.runtime.openOptionsPage();
    }
}
