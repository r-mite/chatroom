// 1.モジュールオブジェクトの初期化
var fs = require("fs");
var server = require("http").createServer(function(req, res) {
	res.writeHead(200, {"Content-Type":"text/html"});
	var output = fs.readFileSync("./index.html", "utf-8");
	res.end(output);
}).listen(80);
var io = require("socket.io").listen(server);

var Promise = require('es6-promise').Promise;

var _ = require('lodash');

// ユーザ管理
var userHash = {};
var userCount = 0;
var userMax = 9999;
var roomid = 4545;
var dealing = -1;
var dealList = {};
var dealUserMax = -1;

//表示メッセージ種類
/*
0:個人機械メッセージ
1:全体機械メッセージ
2:全体人間メッセージ
3:全体番号メッセージ
4:コマンドメッセージ
5:ディール通常メッセージ
6:ディールシステムメッセージ
*/

// 2.イベントの定義
io.sockets.on("connection", function (socket) {

//接続開始イベント
	socket.on("connected", function(name){
		//コマンドはルームに入る前から使える
		var handshake = JSON.parse(JSON.stringify(socket.handshake));
		var remoteAddress = handshake["address"].substr(-11,9);
		var exp = new RegExp("cmd ");
		if(remoteAddress == "192.168.3" && name.search(exp) == 0){
			var cmd = checkCommand(name.substr(4));
			switch(cmd.num){
				case 2:
					io.sockets.emit("set", mergeSetList());
					break;
				case 4:
					if(cmd.val !== void 0){
						io.to(cmd.val).emit("return", {value:4});
					}
					break;
				case 5:
					io.to(roomid).emit("push", {val:6, mes:"DEAL:開始しました。"});
					io.sockets.emit("set", mergeSetList());
					io.sockets.emit("deal", {val:true});
					break;
				case 6:
					io.to(roomid).emit("push", {val:6, mes:"DEAL:中止しました。"});
					io.sockets.emit("set", mergeSetList());
					io.sockets.emit("deal", {val:false});
					break;
				case 7:
					if(cmd.val !== void 0){
						var pick = pickRanking(cmd.val);
						io.to(roomid).emit("push", {val:6, mes:"DEAL:現在のランキング" + cmd.val + "位は" + userHash[pick] + "!後に続け!(" + (dealList[pick] < 0 ? "パス" : dealList[pick]) + ")"});
					}
					break;
				case 8:
					io.sockets.emit("deal", {val:true});
					break;
				case 9:
					io.sockets.emit("deal", {val:false});
					break;
			}
			
			socket.emit("push", {val:4, mes:cmd.mes});
			return;
		}
		//人数チェック
		if(userCount >= userMax){
			socket.emit("set", {num:userCount, max:userMax, mem:rebuildUser()});
			socket.emit("push", {val:0, mes:'女ドラフ部屋は満員です。'});
			return;
		}
		//名前重複
		for(key in userHash){
			if(name == userHash[key]){
				socket.emit("push", {val:0, mes:'同じ名前のきくうしさまがいます。'});
				return;
			}
		}
		//文字列の長さ
		if(name.length > 20){
			socket.emit("push", {val:0, mes:'長すぎて主がかみまみた。'});
			return;
		};
		//あるマイトは一人
		if(remoteAddress != "192.168.3"){
			if(name == "あるマイト"){
				socket.emit("push", {val:0, mes:'その子は忌み子、忌み子じゃよ！！'+remoteAddress});
				return;
			}
		}
		//入室処理
		userHash[socket.id] = name;
		socket.join(roomid);
		userCount++;
		socket.emit("name", {name:name});
		io.sockets.emit("set", mergeSetList());
		io.to(roomid).emit("push", {val:1, mes:'"' + name + '"きくうしさまが入室しました。'});
	});

//メッセージ送信イベント
	socket.on("push", function(message){
		//コマンド
		var handshake = JSON.parse(JSON.stringify(socket.handshake));
		var remoteAddress = handshake["address"].substr(-11,9);
		var exp = new RegExp("cmd ");
		if(remoteAddress == "192.168.3" && message.search(exp) == 0){
			var cmd = checkCommand(message.substr(4));
			switch(cmd.num){
				case 2:
					io.sockets.emit("set", mergeSetList());
					break;
				case 4:
					if(cmd.val !== void 0){
						io.to(cmd.val).emit("return", {value:4});
					}
					break;
				case 5:
					io.to(roomid).emit("push", {val:6, mes:"DEAL:開始しました。"});
					io.sockets.emit("set", mergeSetList());
					io.sockets.emit("deal", {val:true});
					break;
				case 6:
					io.to(roomid).emit("push", {val:6, mes:"DEAL:中止しました。"});
					io.sockets.emit("set", mergeSetList());
					io.sockets.emit("deal", {val:false});
					break;
				case 7:
					if(cmd.val !== void 0){
						pickRanking(cmd.val).then(function(pick){
							io.to(roomid).emit("push", {val:6, mes:"DEAL:現在のランキング" + cmd.val + "位は" + userHash[pick] + "!後に続け!(" + (dealList[pick] < 0 ? "パス" : dealList[pick]) + ")"});
						});
					}
					break;
				case 8:
					io.sockets.emit("deal", {val:true});
					break;
				case 9:
					io.sockets.emit("deal", {val:false});
					break;
			}
			
			socket.emit("push", {val:4, mes:cmd.mes});
			return;
		}
		//名無し確認<-強制退出後にメッセージを送信
		if(!(socket.id in userHash)){
			socket.emit("push", {val:0, mes:'きくうしさまの名前をおシエテください。'});
			return;
		}
		//メッセージなし
		exp = new RegExp("^$|^\\s+$");
		if(message.search(exp) == 0){
			return;
		}
		//dealモード時
		if(dealing>0){
			var end = false;
			exp = new RegExp("^deal$");
			if(message.search(exp) == 0){
				if(!dealList[socket.id]){
					dealing--;
					var rnd = Math.floor( Math.random() * 9999 ) + 1;
					dealList[socket.id] = rnd;
					io.to(roomid).emit("push", {val:5, name:userHash[socket.id], mes:rnd + "を出した!"});
				}
				end = true;
			}
			exp = new RegExp("^pass$");
			if(message.search(exp) == 0){
				if(!dealList[socket.id]){
					dealing--;
					dealList[socket.id] = -1;
					io.to(roomid).emit("push", {val:5, name:userHash[socket.id], mes:"パスした。"});
				}else if(dealList[socket.id] != -1){
					dealList[socket.id] = -1;
					io.to(roomid).emit("push", {val:5, name:userHash[socket.id], mes:"パスした。"});
				}
				end = true;
			}
			if(dealing == 0){
				pickRanking(1).then(function(key){
					if(dealList[key] < 0){
						io.to(roomid).emit("push", {val:6, mes:"DEAL:防衛失敗"});
					}else{
						io.to(roomid).emit("push", {val:6, mes:"DEAL:現在のランキング1位は" + userHash[key] + "!後に続け!(" + (dealList[key] < 0 ? "パス" : dealList[key]) + ")"});
					}
					io.sockets.emit("deal", {val:false});
				});
			}
			if(end){
				io.sockets.emit("set", mergeSetList());
				return;
			}
		}
		//メッセージ送信
		var num = 2;
		exp = new RegExp("\\b([a-zA-Z0-9]{5}|[a-zA-Z0-9]{8})\\b");
		if(message.search(exp) == 0){
			num = 3;
		}
		io.to(roomid).emit("push", {val:num, name:userHash[socket.id], mes:escape_html(message.substr(0,100))});
	});

//自動返信イベント
	socket.on("auto", function(data){
		if(data.value == 4){
			socket.leave(roomid);
			var message = "\"" + userHash[socket.id] + "\"きくうしさまが退室させられました。";
			delete userHash[socket.id];
			userCount--;
			io.sockets.emit("set", mergeSetList());
			io.sockets.emit("push", {val:1, mes:message});
			if(userCount <= 0){
				init();
			}
		}
	});

//接続終了組み込みイベント
	socket.on("disconnect", function () {
		if (userHash[socket.id]) {
			var message = "\"" + userHash[socket.id] + "\"きくうしさまが退室しました。";
			delete userHash[socket.id];
			userCount--;
			io.sockets.emit("set", mergeSetList());
			io.sockets.emit("push", {val:1, mes:message});
			if(userCount <= 0){
				init();
			}
		}
	});
/*
	socket.on("change", function(name){
		if (userHash[socket.id]) {
			var msg = "\"" + userHash[socket.id] + "\"さんが\"" + name + "\"にコテハンを変更しました。";
			userHash[socket.id] = name;
			io.to(roomid).emit("push", {value:msg});
		}
	});
*/
});

//コマンド別の処理
function checkCommand(cmd){
	//1:変数初期化
	var exp = new RegExp("reset");
	if(cmd.search(exp) == 0){
		init();
		return {num:1, mes:"コマンド:RESETを使用"};
	}
	//2:ルーム最大値を設定
	exp = new RegExp("max \\d+");
	if(cmd.search(exp) == 0){
		var max = cmd.substr(4, cmd.length-1);
		userMax = Number(max);
		return {num:2, mes:"コマンド:MAXを使用 -> " + max};
	}
	//3:コマンド確認
	exp = new RegExp("list");
	if(cmd.search(exp) == 0){
		var list = "コマンド:LISTを使用 ->"
			+"<br />reset: 初期化"
			+"<br />max [数値]: ルーム容量"
			+"<br />list: コマンド確認"
			+"<br />del [名前]: 強制退室"
			+"<br />deal: ディール"
			+"<br />rank [数値]: ランキング"
			+"<br />ondeal: ボタン表示"
			+"<br />offdeal: ボタン非表示";
		return {num:3, mes:list};
	}
	//4:強制退室
	exp = new RegExp("del ");
	if(cmd.search(exp) == 0){
		var name = cmd.substr(4, cmd.length-1);
		var id;
		for(key in userHash){
			if(name == userHash[key]){
				id = key;
				break;
			}
		}
		if(id === void 0){
			return {num:4, mes:"コマンド:DELに対応する名前はありません。", val:id};
		}
		return {num:4, mes:"コマンド:DELを使用 -> \"" + name + "\"を退室させました。", val:id};
	}
	//5,6:ディール機能
	var exp = new RegExp("deal");
	if(cmd.search(exp) == 0){
		if(dealing >= 0){
			dealing = -1;
			dealUserMax = -1;
			return {num:6, mes:"コマンド:DEALを停止"};
		}
		dealing = userCount;
		dealUserMax = userCount;
		dealList = {};
		return {num:5, mes:"コマンド:DEALを使用"};
	}
	//7:ランキング確認
	var exp = new RegExp("rank \\d+");
	if(cmd.search(exp) == 0){
		var rank = cmd.substr(4, cmd.length-1);
		rank = Number(rank);
		if(rank < 1 || dealUserMax - dealing < rank){
			return {num:7, mes:"コマンド:RANKINGに対応する数値ではありません。"};
		}
		return {num:7, mes:"コマンド:RANKINGを使用", val:rank};
	}
	//8:ディールのボタン表示のみ
	var exp = new RegExp("ondeal");
	if(cmd.search(exp) == 0){
		return {num:8, mes:"コマンド:ONDEALを使用"};
	}
	//9:ディールのボタン非表示のみ
	var exp = new RegExp("offdeal");
	if(cmd.search(exp) == 0){
		return {num:9, mes:"コマンド:OFFDEALを使用"};
	}
	//-1:該当なし
	return {num:-1, mes:"ニュージェネかな。"};
}

//変数初期化
function init(){
	userHash = {};
	userCount = 0;
	userMax = 9999;
	dealing = -1;
	dealList = {};
	dealUserMax = -1;
}

//ユーザー連想配列再編成
function rebuildUser(){
	var hash = {};
	var i = 0;
	for(key in userHash){
		hash[i] = userHash[key];
		i++;
	}
	return hash;
}

//ディール連想配列再編成
function rebuildDeal(){
	var hash = {};
	var i = 0;
	for(key in userHash){
		hash[i] = dealList[key];
		i++;
	}
	return hash;
}

//html特殊文字エスケープ
function escape_html(string){
	if(typeof string !== 'string'){
		return string;
	}
	var exp = new RegExp("[&'`\"<>]", "g");
	return string.replace(exp, function(match){
		switch(match){
			case '&':
				return '&amp;';
			case "'":
				return '&#x27;';
			case '`':
				return '&#x60;';
			case '"':
				return '&quot;';
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
		}
	});
}

//任意ランキング取り出し
function pickRanking(num){
	return new Promise(function(resolve){
		var dealAry = [];
		for(key in dealList){
			dealAry.push({"key":key, "deal":dealList[key]});
		}
		_.sortBy(dealAry, "deal");
		/*
		dealAry.sort(function(a,b){
			return Number(a.deal) < Number(b.deal);
		});*/
		console.log(dealAry);
		resolve(dealAry[num-1].key);
	});
}

//setエミット用jsonリスト
function mergeSetList(){
	return {num:userCount, max:userMax, mem:rebuildUser(), dnum:dealUserMax, dmem:rebuildDeal()};
}