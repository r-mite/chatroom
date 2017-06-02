var socketio = io.connect(location.href);
//コールバック
socketio.on("connected", function(name) {});
socketio.on("set", function(data) {
    countFamily(data.num, data.max, data.mem, data.dnum, data.dmem);
});
socketio.on("push", function(data) {
    addMessage(data.val, data.name, data.mes);
});
socketio.on("name", function(data) {
    setName(data.id, data.name)
});
socketio.on("deal", function(data) {
    appearButton(data.val)
});
socketio.on("fire", function(data) {
    displayFireworks(data.num)
});
socketio.on("return", function(data) {
    socketio.emit("auto", data);
});
socketio.on("disconnect", function() {});

//送信部
var first_push = false;
$('#msg_button').on('click', function pushMessage(text) {
    if (text == "") {
        text = $('#msg_box').val();
        if (text == "")
            return;
        }
    socketio.emit(first_push
        ? "push"
        : "connected", text);
    $('#msg_box').val('');
})

function survivalMessage() {
    if (sessionStorage.getItem('uniID') == null)
        return;
    console.log("survival");
    socketio.emit("survival", sessionStorage.getItem('uniID'));
}

//受信部
function countFamily(num, max, mem, dnum, dmem) {
    $('li#info').empty();
    var text = '<span class="glyphicon glyphicon-home"></span>' + num + '/' + max;
    if (dnum > 0) {
        $(".dealbar").html(Object.keys(dmem).length + '/' + dnum);
        $(".dealbar").css({
            width: Object.keys(dmem).*100 / dnum + "%"
        });
    }
    $('li#info').append(text);
    $('ul#member').empty();
    for (key in mem) {
        if (dnum > 0) {
            text = '<li><a href="" onClick="return false;"><span class="label label-' + (dmem[key]
                ? 'success">deal</span>'
                : 'default">no deal</span>') + mem[key] + '</a></li>';
        } else {
            text = '<li><a href="" onClick="return false;">' + mem[key] + '</a></li>';
        }
        $('ul#member').append(text);
    }
}

function setName(id, name) {
    console.log("setName");
    first_push = true;
    sessionStorage.setItem('uniID', id);
    $('#msg_box').attr('placeholder', '例)12345678 つよばはHL');
    var text = '<strong>' + name + '</strong> なの。';
    $('li#user').html(text);
}

function appearButton(val) {
    if (val) {
        $('.dealpass').css({display: ""});
    } else {
        $('.dealpass').css({display: "none"});
    }
}

function displayFireworks(num) {
    if (num < 1)
        return;
    setTimeout(function() {
        createFirework(25, 187, 5, 1, null, null, null, null, false, true);
        displayFireworks(num - 1);
    }, 1000 - Math.floor(Math.random() * 700));
}

function addMessage(num, name, mes) {
    var obj = $('<li class="' +
    'chat pat' + num + '"/>').css({right: '40px', opacity: 0});
    var text = '[' + new Date().toLocaleTimeString() + '] ' + mes;
    if (name !== void 0) {
        text += " by " + name;
    }
    if (num == 3) {
        obj.attr('data-room', mes);
        obj.attr('onClick', 'copyList(this);');
    }
    obj.html(text);
    $('ul.chatlist').prepend(obj);
    obj.animate({
        right: '0',
        opacity: 1
    }, 700);
}

//クリップボードコピー
function copyList(obj) {
    //コピー処理
    var copyFrom = $('<textarea>');
    copyFrom.val(obj.dataset.room);
    $('body').append(copyFrom);
    copyFrom.select();
    document.execCommand('copy');
    copyFrom.remove();
    //アラート処理
    var modal = $('<div class="alert alert-dismissible alert-success modalbox"><button type="button" class="close" data-dismiss="alert">×</button>ファクシミリしました。</div>');
    $('div#alert').append(modal);
    slideIn().then(slideOut);
}

//モーダルスライド
function slideIn() {
    var d = new $.Deferred;
    var modal = $('div.modalbox');
    modal.animate({
        opacity: 1
    }, 700, function() {
        d.resolve();
    });
    return d.promise();
}

function slideOut() {
    var d = new $.Deferred;
    var modal = $('div.modalbox');
    modal.delay(2000).animate({
        opacity: 0
    }, 700, function() {
        modal.remove();
        d.resolve();
    });
    return d.promise();
}

//ページ表示時
$(function() {
    survivalMessage();
    countFamily(0, 0, 0, 0, 0);
    $('li.chat').css({right: '40px', opacity: 0}).each(function(i) {
        $(this).delay(300 * i).animate({
            right: '0',
            opacity: 1
        }, 700);
    });
    appearButton(false);
})
