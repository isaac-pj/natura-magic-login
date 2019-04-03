
console.log("Natura Magic Login is running!")
chrome.runtime.onMessage.addListener(gotMessage)
const userNameInput = document.querySelector('#username');
const passwordInput = document.querySelector('#password');
const enterButton = document.querySelector('#botaoOK');

function gotMessage (request, sender, sendResponse){
    switch(request.type){
        case 'toBackground':
            console.log("Sended to background!")
            sendToBackground(request);
            break
        case 'fromBackground':
            console.log(request)
            break
        case 'getProps':
            sendResponse({ script: getAuthenticationMethod() }) 
            break
        case 'getLogin':
            sendResponse(getLogin(request.username, request.password));
            break
        case 'getTokenLifetime':
            sendResponse(validateToken());
        default:
            return null
    }
}

function sendToBackground(request){
    chrome.runtime.sendMessage(request, function(response){
        console.log(response)
    })
}

function getLogin(username, password){
    userNameInput.value = username;
    passwordInput.value = password;
    sendToBackground({type: "waitLogin", delay: 5000});
    enterButton.click()
    return true
}

function validateToken(){
    currentTime = new Date();
    tokenLifetime = localStorage.getItem('accessTokenExpiresInNaturaWeb');
    return tokenLifetime && currentTime.toString().localeCompare(tokenLifetime) == -1 ? true : false
}

function getAuthenticationMethod() {
    if(document.location.href.indexOf("consultoriahml.natura.com.br/webfv") != -1){
        const getCookie = (name) => {
            function escape(s) {
                return s.replace(/([.*+?\^${}()|\[\]\/\\])/g, '\\$1');
            }
            var match = document.cookie.match(RegExp(`(?:^|;\\s*)${  escape(name)  }=([^;]*)`));
            return match ? match[1] : null;
        };
    
        const environment = 'consultoriahml.natura.com.br';
        const accessTokenNaturaWeb = localStorage.getItem('accessTokenNaturaWeb');
        const accessTokenExpiresInNaturaWeb = localStorage.getItem('accessTokenExpiresInNaturaWeb');
        const cnoTokenNaturaWeb = localStorage.getItem('cnoTokenNaturaWeb');
        const personIdNaturaWeb = localStorage.getItem('personIdNaturaWeb');
        const cookie = getCookie(`OAMAuthnCookie_${environment}:80`);
    
        const code = `
            const setAuthentication = () => {
                const localStorageItems = {
                    'accessTokenNaturaWeb': \`${accessTokenNaturaWeb}\`,
                    'accessTokenExpiresInNaturaWeb': \`${accessTokenExpiresInNaturaWeb}\`,
                    'cnoTokenNaturaWeb': \`${cnoTokenNaturaWeb}\`,
                    'personIdNaturaWeb': \`${personIdNaturaWeb}\`,
                };
    
                const localStorageKeys = Object.keys(localStorageItems);
    
                localStorageKeys.forEach((key) => {
                    localStorage.setItem(key, localStorageItems[key])
                });
    
                const cookiesItems = {
                    'HTTP_CDPESSOA': ${personIdNaturaWeb},
                    'OAMAuthnCookie_${environment}:80': \`${cookie}\`,
                };
    
                const cookiesKeys = Object.keys(cookiesItems);
    
                cookiesKeys.forEach((key) => {
                    document.cookie = \`\${key}=\${cookiesItems[key]};\`;
                });
            }
    
            setAuthentication();
        `;
        
        return (
            !environment 
            || !accessTokenNaturaWeb 
            || !accessTokenExpiresInNaturaWeb
            || !cnoTokenNaturaWeb 
            || !personIdNaturaWeb 
            || !cookie ? null : code
        );
    }
};