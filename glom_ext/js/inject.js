const port = chrome.runtime.connect();
const methods = ['getTags', 'ping'];
const service = {
    getTags: tagMedia,
    ping: ping
};
const existingTags = [];
const qrySpecialCharacters = ['+', '-', '!', '&', '(', ')', '|', ','];

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
            modalClass: 'tag-selector',
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
    let host = getHostRoot();
    let url = `${host}/media`;
    let tags = modal.tagger.getTagValues();
    for(let tag of tags){
        for(let char of qrySpecialCharacters){
            if(tag.indexOf(char) >= 0){
                //reject tag for containing illegal character
                alert(`Tags cannot contain '${char}'`);
                return;
            }
        }
    }
    modal.mediaData.tags = tags;
    let data = modal.mediaData;
    data.username = options.username;
    let hed = new Headers(
        {
            'Content-Type': 'application/json'
        }
    );
    let req = new Request(url,
        {
            method: 'POST',
            headers: hed,
            mode: 'cors',
            body: JSON.stringify(data)
        }
    );
    fetch(req).then(function(response){
        if(response.ok){
            console.log('Item has been glommed.', modal.mediaData);
            console.log(response);
            modal.close();
        }else{
            console.log('An error occurred: item was not glommed.', modal.mediaData);
            console.log(response);
        }
    });
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
