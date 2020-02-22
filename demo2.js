const botkit = require('botapp-external')
// const botkit = require('../lib/BotApp.js')

class MyBotApp extends botkit.BotApp {

    onUserEnterRoom(bot, room){
        bot.sendText(`您好，我是【${bot.name}】，很高兴为您服务!`, room.roomId)
        let item = new botkit.MenuItem("输入指令", "new")
        let menu = new botkit.Menu([item], "inplace");
        return menu
    }

    *handlers(bot){
        yield {
            callback:(respMsg)=>{
                let action = botkit.GetAction(respMsg)

                if (action == 'new') {
                    let input = new botkit.Input(["指令："], "详细说明文字", "inplace")
                    return input

                } else {
                    let text = new botkit.PureText("请按要求操作")
                    text.SetEnd(true)
                    return text
                }
            }
        };

        yield {
            callback:(respMsg)=>{
                let input = botkit.GetInput(respMsg)
                let channel = botkit.GetRoomID(respMsg)

                bot.sendText("收到指令："+input[0], channel)

                let item = new botkit.MenuItem("输入指令", "new")
                let menu = new botkit.Menu([item], "inplace");
                menu.SetEnd(true)
                return menu
            }
        };
    }
}

require('./config.js').then((config)=>{
    new MyBotApp(config).run();
})
.catch((err)=>{
    console.error(err);
    process.exit(1);
});
