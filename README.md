# botapp-external 库

botapp-external 是一个支持 convoUI 的机器人（bot）开发框架

## 1. 说明

### 1.1 Installation
```
npm install botapp-external
```

### 1.2 Demo
```
const botkit = require('botapp-external')

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
```


### 1.3 机器人应用代码结构

机器人开发者只需继承BotApp类，然后覆盖产生器函数（generator function）handlers，即可集中于书写机器人业务处理逻辑，而将其他消息来往处理细节交给 botapp-external 框架。

这种业务处理逻辑，实际上就是有序的一组回调函数（callback），它们表示了会话的逐个步骤，以及当前步骤是否能推进，以及推进会话的下一个消息。


```
//你的机器人工程目录/app.js
//引入框架类
const botkit = require('botapp-external');
class MyBotApp extends botkit.BotApp {
    //覆盖这个方法可以提供机器人进入聊天室时的欢迎信息
    onJoinRoom(bot,room){
        return new botkit.PureText(`亲，我是机器人【${bot.name}】，荣幸进入聊天室【${room.name}】输入以下任一文字开始签署服务条款：agreement，服务条款，fwtk`)
    }
    *handlers(bot){
       //yield的第一个消息是响应会话启动标志的消息，这个例子以用户在聊天室输入“license”或“服务条款”来启动会话
        yield {
            pattern:/^(agreement|服务条款|fwtk)/i,
            callback:()=>{
                return new botkit.Menu([new botkit.MenuItem("点击同意服务条款", "step1")], "inplace")
            }
       };
       yield ...; //更多后续的消息处理
   }
}

//启动机器人实例
new MyBotApp(require('./config.json')).run();
```

yield的第一个消息是一个ConvoUI会话的初始消息（收到触发或启动标志时）。每次yield提供一个`handler`对象，它包括两个key：

- pattern：可选。通常不需要提供，除非你指定一个用户在聊天室中回复文本消息的模式
- callback：必需。这个函数返回一个ConvoUI消息（参考[ConvoUI协议](https://git.finogeeks.club/mesons-bots/botapp-external/src/master/README_FORDEV.md#3-convoui-)）或者返回空（null或undefined）。返回空时，表示之前用户端的应答不符合会话推进的条件。返回的消息，将会推进会话到下一步。除了初始应答（第一个yield），当不提供pattern时，在botapp-external 框架内部会自动按ConvoUI消息及ConvoUI Reply的id进行匹配。



## 2 机器人与用户会话发起的场景

### 2.1 场景一，房间存在，用户与机器人分别被邀请进入

![](http://olrr6o835.bkt.clouddn.com/20170412101512_Ufgw2j_Screenshot.jpeg)

此场景对 botapp-external 框架的需求是：

- 受邀进入房间时，事件激发欢迎消息：onJoinRoom
- 捕捉到有新用户（原先不在此房间的）进入房间时，事件激发欢迎消息：onUserJoinRoom

### 2.1 场景二，房间存在，用户U和机器人A会话时，机器人A自动邀请机器人B进入

此场景对机器人框架的需求是：

- 机器人A在与用户会话时，某种情况下发出为一个房间邀请消息给机器人B。
- 机器人B自动进入房间

机器人B收到邀请进入房间后，其行为同场景一。



## 3. ConvoUI 消息及应答格式说明

### 3.1 convoUI 通用说明

#### 3.1.1 渲染参数 disply

convoUI 生成参数中（详见下列控件），最后一个参数 display 用于控制ConvoUI消息（控件）的展示形式，目前思考，有以下几种：

不提供此参数：不作限制，由前端自行决定
fixed：控件“建议”显示在固定区域
popup：控件“建议”弹出显示
inplace：控件“建议”显示在聊天历史记录中
assist: 控件“建议”显示在文字输入助理区域（目前仅文字助手控件支持此显示方式）

#### 3.1.2 展示过期参数

`convo.SetDisplayExpires(value)`参数用于指定在fixed、popup形式下的控件是否允许再次打开显示。如果未指定，则Web客户端上可以在历史消息中点开查看；若指定，则历史消息中不再提供打开按钮。

此值是一个过期时间（绝对时间，非相对时间）的长整数时间戳（epoch毫秒值）。


#### 3.1.3 版本参数

`convo.SetVersion()`，该参数用于在iOS设备上兼容旧版本的ConvoUI

当前  `convo.SetVersion("2.0")`

**不必手动设置版本**

#### 3.1.4 接收者参数

`convo.SetReceiver()`用于控制ConvoUI消息（控件）的接收对象。如果不指定，则表示不限定接收者。如果指定，这个数据是一个JSON数组，表示其中包含的userId的聊天界面上应该显示此ConvoUI消息，否则应隐藏。例如：

```
convo.SetReceiver(["@frank:finogeeks.club","@test:finogeeks.club"])
```

表示当前ConvoUI消息仅仅在frank和test两个用户的界面上显示，其他用户的界面上应该隐藏。

**指定所有人接收时，请明确设置receiver为null或空数组。这是因为，如果数据完全没有这个键的话，框架会自动添加当前用户为receiver，但如果这个键存在（即使为null或空数组），它就会知道是所有用户接收，然后框架会把这个无用的空键去掉**

#### 3.1.5 控制UI应答是否显示

在机器人端发出的ConvoUI消息，客户端呈现UI界面给用户时，用户可能会在UI界面上进行操作（例如按钮点击、菜单选择或者输入等），这些操作即ConvoUI应答的结果，是否需要在消息历史中显示，以参数`convo.SetShowReply()`来控制（默认值为false，即消息历史中隐藏ConvoUI应答），例如：

```
convo.SetShowReply(true)
```

例如在上述按钮出现时，用户点击了“同意条款”按钮，房间消息历史里面会显示应答消息（即应答消息的body文字部分）。这个body文字内容由客户端生成，例如上述按钮点击后文字消息如“点击按钮：同意条款”。依次类推，对于不同ConvoUI控件，这个文字格式有所不同。例如，若是菜单，则用户选择某项X后，显示文字消息为“菜单选择：X”，等等。


#### 3.1.6 控制UI存根消息是否显示

对于display为popup，fixed，assist方式的UI消息而言，以下参数可以控制UI存根（stub，即承载UI的历史消息）是否在历史消息列表中隐藏掉。

```
convo.SetHideStub(true) // 默认为 false
```

#### 3.1.7 控制会话控制是否显示

对于在某个与机器人会话的流程中，用户想做“结束会话”或“重置会话”等操作，这样的会话控制是否需要显示，以参数“convo_control”来控制，默认值为false，即不显示。

```
convo.SetConvoControl(false)
```

**以上本章节参数对所有控件是通用的，convo 表示任何一种控件。在下文的格式描述中，将不再列出这些参数。**


### 3.2 菜单（即按钮组） menu

所谓菜单，其实就是垂直或水平排列的逻辑按钮。

#### ConvoUI Message

```
// title   : 按钮文字
// action  : 事件代码
item = new botkit.MenuItem(title, action)

> `action`不仅可以是字符串，也可以是数字、对象、数组等任意JSON类型，客户端回送时保持原样就好（不要做解析及类型转换）

item.SetReply(true) // 默认为 true，可不设置

// type = "url",    点击则打开对应 value 的网页
// type = "userId", 点击则打开对应 value 用户的单聊页面
item.AddMeta(type, value)

menu = new botkit.Menu([item, ...], display)
```

- items中的`reply`为`false`时，客户端可以不产生应答消息，默认为true。

menu 可以自由添加其他键，满足渲染的需要，例如给菜单增加一个标题（Caption），要求横向排列（horizontal），并在每个按钮上增加一个提示（tip）：

```
menu.SetCaption("请选择一种收费方式")
menu.SetHorizontal(true)
menu.SetTip("想好了再按")
```

#### ConvoUI Reply

```
action = botkit.GetAction(replyMessage)
result = botkit.GetResult(replyMessage)
```


### 3.3 上传图片 image

#### ConvoUI Message

```
// prompt   : 上传提示文字
// max_size : 文件最大尺寸
image = new botkit.Image(prompt, max_size, display)

image.SetTypes(["png", "jpeg", "gif"]) // 该数组描述可以接受的文件格式
```

#### ConvoUI Reply

```
// info: {
//   h: 398,
//   w: 394,
//   size: 31037,
//   mimetype: "image/jpeg"
// }
info = botkit.GetInfo(replyMessage)
url = botkit.GetUrl(replyMessage)
```


### 3.4 上传视频 video

#### ConvoUI Message

```
// prompt   : 上传提示文字
// max_size : 文件最大尺寸
video = new botkit.Video(prompt, max_size, display)

video.SetTypes(["mp4","webm","ogg"])  // 该数组描述可以接受的文件格式
```


#### ConvoUI Reply

```
// info: {
//   h: 320,
//   w: 480,
//   size: 1563685,
//   duration: 2140786,
//   mimetype: "video/mp4",
//   thumbnail_url: "mxc://finogeeks.club/FHyPlCeYUSFFxlgbQYZmoEoe",
//   thumbnail_info: {
//     h: 300,
//     w: 300,
//     size: 46144,
//     mimetype: "image/jpeg"
//   }
// }
info = botkit.GetInfo(replyMessage)
url = botkit.GetUrl(replyMessage)
```


### 3.5 上传音频 audio

#### ConvoUI Message

```
// prompt   : 上传提示文字
// max_size : 文件最大尺寸
audio = new botkit.Audio(prompt, max_size, display)

audio.SetTypes(["mp3","wav","ogg"])  // 该数组描述可以接受的文件格式
```

#### ConvoUI Reply

```
// info: {
//   size: 1563685,
//   duration: 2140786,
//   mimetype: "audio/mpeg"
// }
info = botkit.GetInfo(replyMessage)
url = botkit.GetUrl(replyMessage)
```


### 3.6 文字输入 input

#### ConvoUI Message

```
// prompt : 输入框上方提示文字,  string 或者 array，对应 GetInput(replyMessage)
// text   : 详细说明文字，例如关于输入内容的详细解释或说明
input = new botkit.Input(prompt, text, display)

input.SetHtml(false)  //text中内容是否为HTML格式化的，可省，默认非HTML格式
input.SetType("text") //可省略，默认为text
```

prompt 为数组时，会渲染出对应个数的input框，reply GetInput 为相应的数组值。
prompt 为字符串时，会渲染出对应的一个input框，reply GetInput 为相应的字符串值。

其中type可以填入的值暂定为：

- text：普通文本
- username：按要求符合用户名格式的文字（按本系统用户名允许字符集）
- password: 密码
- pin：纯数字密码
- number：数字（整数或带小数部分）
- phone：手机或电话
- cellphone：手机号
- email：email地址
- multiline：多行文本，类似HTML中TextArea标签的效果

#### ConvoUI Reply

```
input = botkit.GetInput(replyMessage)
```


### 3.7 获取地理位置 location

#### ConvoUI Message

```
// 可对获取的地点范围等做规定，需要时扩展
location = new botkit.Location(display)
```

#### ConvoUI Reply

```
geo_uri = botkit.GetGeoUri(replyMessage)
```


### 3.8 选择 select

用途：显示一块文字，下方提供选择项。

> 例如：风险评估会话中的选择题
> 例如：一个服务协议，下方配同意还是拒绝的选择

#### ConvoUI Message

```
// text   : 选项文字
// action : 事件代码
item = new botkit.SelectItem (text, action)

item.SetSelected(true) // 可选，表示默认选中

// text : 选择说明文字，例如服务协议内容或选择题题面
select = new botkit.Select([item, ...], text, display)

select.SetMultiple(false) // 是否允许多选，可省，默认单选
select.SetHtml(false)     // text中内容是否为HTML格式化的，可省，默认非HTML格式
```

> items中的`action`不仅可以是字符串，也可以是数字、对象、数组等任意JSON类型，客户端回送时保持原样就好（不要做解析及类型转换）

> items中的`SetSelected()`参数是布尔型参数，表示是否预先选中某选项，对于`menu.SetMultiple(true)`的多选情况，items中可以有多个成员带有`item.SetSelected(true)`。

#### ConvoUI Reply

```
selected = botkit.GetSelected(replyMessage) // 得到事件代码，如果允许多选则可能有多个
```


### 3.9 短信验证码输入 verifycode

#### ConvoUI Message

```
// prompt  : 提示文字
// expires : 过期时间的长整数时间戳（epoch毫秒值）
verifycode = new botkit.Verifycode(prompt, expires, display)
```

#### ConvoUI Reply

```
input = botkit.GetInput(replyMessage) // 用户输入的验证码内容
expires = botkit.GetExpired(replyMessage) // true/false 表示已超过过期时间
```


### 3.10 文字助手 text_assist

此控件的作用是机器人端发出一组文字，由客户端提供给用户作为类似自动完成的文字。具体展示形式由客户端决定（展示在固定区域的可点击文字、或者作为输入的自动完成选单等形式）。用户可以无视这种控件产生的提示。但当用户点击（若以可点击形式出现），则等同于用户发出一条文字消息。

#### ConvoUI Message

```
// items: ["文字一", "文字二", …… ]
text_assist = new botkit.TextAssist(items, display)

text_assist.SetCaption("请选择") // caption 选项是可选的，可有可无
```

**注意**：对于此控件，如果提供了`display`参数，则会按前述三种展示方式来显示这一控件；**如果没有提供这一参数，则采用一种特殊的展示方式，例如直接展示在文字输入框附近（或者自动完成的提示区域）**。所以请明确你的用途：

- 如果主要是输入辅助作用，请不要提供
`display`参数！

- 如果是业务流程中一种菜单性质的选择（和menu控件的区别是产生文字反馈而不是ConvoUI Reply），则可能提供`display`参数比较好。


#### ConvoUI Reply

此消息没有特定响应。当用户点击（若以可点击形式出现）文字时，则等同于用户发出一条普通的Matrix文字消息。


### 3.11 网页嵌入 url_embedded

此控件作用是在显示区直接嵌入一个外部网址。在Web客户端上，最典型的实现方式是采用iframe标签来实现。

#### ConvoUI Message

```
// caption     : 必填，标题，类似微信公众号消息头文字（app端消息渲染用，及图文消息、豆腐块消息渲染用）
// url         : 必填，浏览器可以解析并渲染的url格式, 例如：http://... 或 https://...
// thumbnail   : 必填，类似微信公众号消息中右侧的预览图，此为预览图图片地址（app端消息渲染用，及图文消息、豆腐块消息渲染用）
// description : 必填，类似微信公众号消息细节文字（app端消息渲染用，及图文消息、豆腐块消息渲染用）
// display     : 可选，显示模式, 默认为inplace，可选值有inplace、popup、fixed
url_embedded = new botkit.UrlEmbedded(caption, url, thumbnail, description, display)

url_embedded.SetType("webpage")  // 可选。消息UI类型，默认为网页引入格式，可选值包括webpage（网页）、graphtext（图文）、beancurd（豆腐块）
url_embedded.SetHeight(300)      // 可选。指定网页嵌入区域的高度；宽度不可指定，因为宽度受限于聊天视图的大小
url_embedded.SetScrolling(false) // 可选。true，表示任何时候总是有滚动条；false，一律禁止滚动条。不提供此参数，表示auto（需要时自动出）
url_embedded.SetFooter(true)     // 可选。默认值为true，（只针对图文消息）表示图文消息是否渲染出底部链接
```

> graphtext（图文）、beancurd（豆腐块）只支持 inplace 显示模式，webpage（网页）支持三种。

#### ConvoUI Reply

此消息主要用于展示，没有特定响应。


### 3.12 富文本展示 richtext

此控件的作用根据指定的富文本源以及格式，在显示区渲染出带格式文本效果。目前支持 html 格式和 markdown 格式。

#### ConvoUI Message

```
// source : 富文本源码, 例如，带有html标签的文本；或者 format = markdown 时，markdown 文本源码
richtext = new botkit.Richtext(source, display)

richtext.SetFormat("html")    // 默认 html，同时也支持 markdown
richtext.SetCaption("请浏览") // 可选，标题
richtext.SetThumbnail("")     // 可选，类似微信公众号消息中右侧的预览图，此为预览图图片地址
richtext.SetDescription("")   // 可选，类似微信公众号消息细节文字
richtext.SetType("richtext")  // 可选，消息UI类型，默认为richtext（富文本），可选值包括richtext（富文本）、graphtext（图文）、beancurd（豆腐块）、recruitment（招聘消息）
richtext.SetFooter(true)      // 可选，默认值为true，（只针对图文消息）表示图文消息是否渲染出底部链接
richtext.SetAfter("")         // 可选，招聘消息中头部偏右的文本
```

#### ConvoUI Reply

此消息主要用于展示，没有特定响应。


### 3.13 幻灯片显示 slideshow

此控件的作用是显示一个幻灯片效果。可以看成是`url_embedded`及`richtext`控件的一个组合容器。其成员（每页幻灯片）可以是url_embedded，也可以是richtext。

#### ConvoUI Message


```
// items : [
//   new botkit.UrlEmbedded(...), // 参数同 url_embedded
//   new botkit.Richtext(...), // 参数同 richtext
//   ...
// ]
slideshow = new botkit.Slideshow(items, display)

slideshow.SetCaption("演示幻灯片") // 可选，如提供则在幻灯片显示区之上显示标题
slideshow.SetThumbnail("")         // 可选，类似微信公众号消息中右侧的预览图，此为预览图图片地址
slideshow.SetDescription("")       // 可选，类似微信公众号消息细节文字
slideshow.SetAutoplay(true)        // 可选，默认为true；如果为false，则幻灯片不会自动滚动，需手工切换
```

#### ConvoUI Reply

此消息主要用于展示，没有特定响应。


### 3.14 基本豆腐块 beancurd
豆腐块控件（类似微信分享）。

#### ConvoUI Message

```
// title   : 按钮文字
// link    : 链接地址
// content : 最多三行显示的文本内容
// icon    : 图片
beancurd = new botkit.Beancurd(title, link, content, icon, display)
```

#### ConvoUI Reply

此消息主要用于展示，没有特定响应。


### 3.15 分页组件 pager

分页 + 按钮组（链接🔗）组件

#### ConvoUI Message
```
// title : 按钮元素的文本
// type  : 类型，"url" 或 "action"
// href  : 根据 type，按钮链接地址或action
// after : 按钮元素偏右的文本, 选填
item = botkit.PagerItem(title, type, href, after)

// size : 每页展示数据数
pager = botkit.Pager([item, ...], size, display)

pager.SetCaption("标题文字或标签文字") // 选填，组件的标题或标签说明文字
pager.SetCurrent(1)                    // 选填，number，分页初始化显示页面，默认为1
```

- `items`是一个数组格式的数据，每个数组元素都是一个对象，包含title、href、after、after 属性

#### ConvoUI Reply

```
action = botkit.GetAction(replyMessage)
result = botkit.GetResult(replyMessage)
```


### 3.16 通知显示 notice

此控件作用是轻量化的通知一个状态、消息、内容。可以看成是`url_embedded`、`richtext`及'menu'控件的一个组合容器。

#### ConvoUI Message

```
// key   : 文本
// value : 文本, KV 展示上类似一个 table
item = new botkit.NoticeItem(key, value)

// caption : 标题
notice = new botkit.Notice(caption, items, display)


// text      : 可选，头部内容，为空则不显示header
// font_size : 可选，默认14
// color     : 可选，默认纯黑 #000000 16 进制 RGB 色值
notice.SetHeader(text, font_size, color)

// text      : 可选，底部内容，为空则不显示footer
// font_size : 可选，默认14
// color     : 可选，默认纯黑 #000000 16 进制 RGB 色值
notice.SetFooter(text, font_size, color)

notice.SetUrl("")          // 可选 有链接则可以跳转，没有则不能跳转
notice.SetThumbnail("url") // 可选，一张小图片
notice.SetDescription("")  // 可选，类似微信公众号消息细节文字

// 可选，底部按钮，移动端建议不要超过3个
notice.SetMenu([new botkit.MenuItem(title, action), new botkit.MenuItem(title, action)]
 ```

#### ConvoUI Reply

```
action = botkit.GetAction(replyMessage)
result = botkit.GetResult(replyMessage)
```



## 4. 目前各端支持的消息的类型

|      ConvoUI 类型       | Web  |       iOS       | Android |
| :-------------------: | :--: | :-------------: | :-----: |
|    convo.ui.button    | all + assist,不推荐 |none | none |
|     convo.ui.menu     | all + assist  | inplace / fixed | inplace / fixed|
|    convo.ui.image     | all  | inplace / fixed |         |
|    convo.ui.video     | none  | inplace / fixed |         |
|    convo.ui.audio     | none  | inplace / fixed |         |
|    convo.ui.input     | all  | inplace / fixed |         |
|   convo.ui.location   | none  | inplace / fixed |         |
|    convo.ui.select    | all  | inplace / fixed | inplace / fixed |
|  convo.ui.verifycode  | all  | inplace / fixed |         |
| convo.ui.text_assist  | assist  |   assist    |   assist   |
| convo.ui.url_embedded | all  |        inplace        |         |
|   convo.ui.richtext   | all  |        inplace        |         |
| convo.ui.slideshow    | all  |        inplace      |         |
| convo.ui.beancurd     | inplace |   inplace   |   inplace  |
| convo.ui.graphtext    | inplace |   inplace   |  inplace  |
| convo.ui.pager        | inplace |   inplace   |  inplace  |
| convo.ui.notice       | inplace |   inplace   |  inplace  |

* all : 指inplace、fixed、popup三种形式都支持
* none：该端不支持本控件
* / ：暂未实现，即将支持
* 留空：尚未填写
* 不推荐：支持但不推荐使用

