const botkit = require('botapp-external')
// const botkit = require('../lib/BotApp.js')

// 存储演示的项目
let server = {}

class MyBotApp extends botkit.BotApp {

    onJoinRoom(bot, room){
        bot.sendText(`您好，我是【${bot.name}】，很高兴为您服务!`, room.roomID)
        let item1 = new botkit.MenuItem("新建项目","new")
        let item2 = new botkit.MenuItem("查询项目","list")
        let menu  = new botkit.Menu([item1, item2], "inplace");
        return menu
    }

    onUserEnterRoom(bot, room){
        bot.sendText(`您好，我是【${bot.name}】，很高兴为您服务!`, room.roomID)
        let item1 = new botkit.MenuItem("新建项目","new")
        let item2 = new botkit.MenuItem("查询项目","list")
        let menu  = new botkit.Menu([item1, item2], "inplace");
        return menu
    }

    *handlers(bot){
        yield {
            callback:(respMsg)=>{
                let action = botkit.GetAction(respMsg)
                let channel = botkit.GetRoomID(respMsg)

                if (action == 'new') {
                    let input = new botkit.Input(["product_id  ", "fisp_serial "], "请输入产品信息", "inplace")
                    return input

                } else if (action == 'list') {
                    bot.sendText(JSON.stringify(server), channel)
                    let item1 = new botkit.MenuItem("新建项目","new")
                    let item2 = new botkit.MenuItem("查询项目","list")
                    let menu  = new botkit.Menu([item1, item2], "inplace");
                    menu.SetCaption("点击选择对应操作")
                    menu.SetEnd(true)
                    return menu

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

                let id = input[0]
                let serial = input[1]
                // add server
                server[id] = serial

                bot.sendText("添加服务成功", channel)

                let item1 = new botkit.MenuItem("新建项目","new")
                let item2 = new botkit.MenuItem("查询项目","list")
                let menu  = new botkit.Menu([item1, item2], "inplace");
                menu.SetCaption("点击选择对应操作")
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
