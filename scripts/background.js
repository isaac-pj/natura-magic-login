console.log("Background is running!")
const currentTab = { active: true, currentWindow: true };

chrome.runtime.onMessage.addListener(gotMessage) 

function gotMessage (request, sender, sendResponse){
    switch(request.type){
        case 'waitLogin':
            waitLogin(request.delay);
            break
        default:
            return null
    }
}

function waitLogin(time){
    setTimeout(function(){
        chrome.extension.sendMessage({type: 'fromBackground'});
    }, time);
}