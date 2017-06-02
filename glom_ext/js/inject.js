const port = chrome.runtime.connect();
const methods = ['getTags', 'ping'];
const service = {
    getTags: tagMedia,
    ping: ping
};
const existingTags = [];

let options;

port.onMessage.addListener(msgReceived);
getSettings();
getExistingTags();

function getExistingTags(){
    let host = getHostRoot();
    let url;
    if (!(options && options.username)){
        window.setTimeout(getExistingTags, 2000);
        console.log('No username found in settings.');
        return;
    }
    if (host){
        url = `${host}/tags/${options.username}`;
    }else{
        window.setTimeout(getExistingTags, 5000);
        console.log('No host found in settings.');
        return;
    }
    let hed = new Headers(
        {
            'Content-Type': 'application/json'
        }
    );
    let req = new Request(url,
        {
            method: 'GET',
            headers: hed,
            mode: 'cors'
        }
    );
    fetch(req).then(function(response){
        if(response.ok){
            return response.json();
        }else{
            console.log(response);
        }
    }).then(updateExistingTags);
}

function updateExistingTags(json){
    existingTags.length = 0;
    for(let tag of json.tags){
        existingTags.push(tag);
    }
    /***purely for testing***/
    if(existingTags.length === 0){
        for(let fake of ['testing', 'dummy', 'not real', 'faking it']){
            existingTags.push(fake);
        }
    }
    /************************/
    window.setTimeout(getExistingTags, 90000);
}

function getSettings(){
    chrome.storage.sync.get(null, copySettings);
}

function copySettings(data){
    options = data;
}

function tagMedia(data){
    let modal = picoModal(
        {
            content: '',
            width: '30vw'
        }
    );
    let btn = document.createElement('button');
    btn.innerHTML = 'Save';
    btn.modal = modal;
    btn.addEventListener('click', function(e){glomItem(this.modal)});
    modal.afterClose(function(mod){mod.destroy()});
    modal.tagger = new Taggle(modal.modalElem());
    modal.mediaData = data.mediaItem;
    modal.serverToken = data.token;
    modal.show();
    modal.autocomplete = new Awesomplete(modal.modalElem().children[2].children[0].children[0], {list: existingTags});
    modal.modalElem().appendChild(btn);
}

function glomItem(modal){
    modal.mediaData.tags = modal.tagger.getTagValues();
    console.log('Item has been glommed.');
    console.log(modal.mediaData);
}

function msgReceived(msg, sender){
    if(msg.method && methods.indexOf(msg.method) > -1){
        if(msg.data){
            service[msg.method](msg.data);
        }else{
            service[msg.method]();
        }
    }else{
        console.log('Noncomplient message received.');
        console.log(msg);
        console.log(sender);
    }
}

function ping(){
    port.postMessage({status: 'pong'});
}

function getHostRoot(){
    if(options){
        if(options.port){
            return `${options.hostname}:${options.port}`;
        }else{
            return options.hostname;
        }
    }else{
        return null;
    }
}
