chrome.storage.sync.get(null, popFields);
document.getElementById('update-config').addEventListener('click', handler);

function handler(e){
    chrome.storage.sync.set(
        {
            hostname: document.getElementById('hostname').value,
            password: document.getElementById('userpassword').value,
            port: document.getElementById('hostport').value || null,
            username: document.getElementById('username').value
        }
    );
    window.close();
}

function popFields(data){
    if(data){
        if(data.hostname){
            document.getElementById('hostname').value = data.hostname;
        }
        if(data.port){
            document.getElementById('hostport').value = data.port;
        }
        if(data.username){
            document.getElementById('username').value = data.username;
        }
        if(data.password){
            document.getElementById('userpassword').value = data.password;
        }
    }
}
