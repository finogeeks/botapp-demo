const readline = require('readline');
let  configTemplate = {
    "matrix":{
        "base_url": 'Base Url',
        "login_uri":"/_matrix/client/api/v1/login",
        "user_id":"gordanyang",
        "password":"123321"
    },
    "debug":false,
    "log":true,
    "autoJoinDelay":100
};
const DEFAULT_DOMAIN='finogeeks.com';


let rl = readline.createInterface(process.stdin, process.stdout);

module.exports = new Promise((resolve,reject)=>{
    rl.question('测试机器人的用户名> ', (answer)=>{
        resolve(answer);
    });
}).then((user_id)=>{
    let m = user_id.match(/@[^:]+:([\w\-\.]+)/);
    if(!m){
        return new Promise((resolve,reject)=>{
            rl.question(`域[${DEFAULT_DOMAIN}]> `,(answer)=>{
                if(!answer) resolve([DEFAULT_DOMAIN,`@${user_id}:${DEFAULT_DOMAIN}`]);
                else resolve([answer, `@${user_id}:${answer}`]);
            });
        });
    }
    else return [m[1],user_id];
}).then(([domain,user_id])=>{
    // let base_url = domain == DEFAULT_DOMAIN ? 'http://123.207.27.190:8008' : `https://chat.${domain}`;
    let base_url = `https://chat.${domain}`;
    let pass = new Promise((resolve,reject)=>{
                    rl.question('测试机器人的密码> ', (answer)=>{
                        resolve(answer);
                    });
                });

    return Promise.all([base_url, user_id, pass]);
})
.then((data)=>{
    let lobbyRoomId = new Promise((resolve,reject)=>{
                    rl.question('大厅房间ID[若不设置可直接回车]> ', (answer)=>{
                        resolve(answer);
                    });
                });
    return Promise.all(new Array(... data, lobbyRoomId));
})
.then(([base_url,user_id,password,lobbyRoomId])=>{
    rl.close();
    configTemplate.matrix = Object.assign(configTemplate.matrix, {
        base_url,
        user_id,
        password});
    if(lobbyRoomId) configTemplate.lobbyRoomId = lobbyRoomId;
    return configTemplate;
});

