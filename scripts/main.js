let authScript = null;
const currentTab = { active: true, currentWindow: true };
let isLoged = userIsLoged();

const NATURA_URL = "https://consultoriahml.natura.com.br/webfv/";
const NATURA_LOCAL_URL = "http://localhost:8009/webfv/";
const NATURA_LOGIN_URL = "https://loginhml.natura.net/";

document.addEventListener('DOMContentLoaded', function () {

    chrome.storage.sync.get(['user'], function(data) {
        if(data.user){
            username.value = data.user.username;
            password.value = data.user.password;
        }
    });
    const remenber = document.querySelector('#remenber');
    remenber.addEventListener('click', () => {
        remenber.value == 'on' ? remenber.value = 'off' : remenber.value = 'on'
    })
    const loginButton = document.querySelector('#loginbutton');
    loginButton.addEventListener('click', () => {
        const username = document.querySelector('#username');
        const password = document.querySelector('#password');
        if(isLoged){
            startMagicLogin();
        }else if(username && password){
            getLogin({type: 'getLogin', username: username.value, password: password.value})
        }else{
            showFeedback({type: "warn", msg: ":( Usuário ou senha não foram informados!"});
        }
    })

    chrome.runtime.onMessage.addListener(gotMessage)
})

function gotMessage(request, sender, sendResponse){ 
    switch(request.type){
        case 'fromBackground':
            isReadyToStart();
            break
        default:
            return null
        }
        
    }
    
    function isReadyToStart(msg){
        chrome.tabs.query(currentTab, function(tabs){
            const { status, url } = tabs[0];
            console.log(status+" "+url)
            if(status == 'complete' && url.indexOf(NATURA_URL) != -1){
                console.log("Getting access to localhost!")
                startMagicLogin();
            }else{
                console.log("Waiting for complet reload")
                setTimeout(function(){
                    isReadyToStart();
                }, 1000)
            }
    })
}

function userIsLoged(){
    chrome.tabs.query(currentTab, function(tabs){
        const action = { type: "getTokenLifetime" }
        chrome.tabs.sendMessage(tabs[0].id, action, function(response){
            isLoged = response;
        });
    });
}

function getLogin(credentials){
    chrome.tabs.query(currentTab, function(tabs){
        if(tabs[0].url.indexOf(NATURA_LOGIN_URL) != -1){
            chrome.tabs.sendMessage(tabs[0].id, credentials, function(response){
                if(response) {
                    remenber(credentials)
                }
            })
        }
    })   
}

function remenber(credentials){
    let remenberMe = document.querySelector('#remenber').value
    if(remenberMe == 'on'){
        setUser({user:{
            username: credentials.username,
            password: credentials.password
        }})
    }
}

function startMagicLogin(){
    chrome.tabs.query(currentTab, function(tabs){
        const action = { type: "getProps" }
        chrome.tabs.sendMessage(tabs[0].id, action, function(response){
            authScript = response.script ? response.script : null;
            chrome.tabs.query({
                url: NATURA_LOCAL_URL,
                currentWindow: true
            }, findTabInLocalhost);
        })
    })
}

function setClock(time){
    //implement on background
}

function findTabInLocalhost(tabs){
    if(tabs.length > 0){
        for(let i in tabs){
            localhostLogin(tabs[i].id);
        }
    }else{
        chrome.tabs.query(currentTab, function(tabs){
            const createProperties = {
                url: NATURA_LOCAL_URL,
                active: false,
                index: tabs[0].index+1
            }
            chrome.tabs.create(createProperties, function (tab){
                localhostLogin(tab.id);     
                console.log("Tab sucessful created!")       
            })

        })
    }
}

function localhostLogin(tab){
    if(authScript && typeof authScript === 'string'){
        chrome.tabs.executeScript(tab, { code : authScript }, function(result){
            chrome.tabs.reload(tab)
        })
    }else{
        console.error(":( Sorry! we have a problem")
    }
}

function showFeedback(feedback){
    switch(feedback.type){
        case 'error':
            console.error(feedback.msg)
            break;
        case 'warn':
            console.warn(feedback.msg)
            break;
        case 'info':
            console.info(feedback.msg)
            break;
        default:
            console.log(feedback.msg)
    }
}

function setUser(data){
    // Save it using the Chrome extension storage API.
    chrome.storage.sync.set(data, function() {
        console.log("Data sucessful writed!");
    });
}