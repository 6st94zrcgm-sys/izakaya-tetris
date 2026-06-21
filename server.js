// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// publicフォルダを公開
app.use(express.static('public'));

// 部屋ごとのゲームデータを記憶する箱
const rooms = {};

io.on('connection', (socket) => {
    // プレイヤーが部屋に入ってきた時の処理
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        socket.roomId = roomId; // 自分の部屋番号を記憶

        // 部屋が初めて作られた場合は空のデータを準備
        if (!rooms[roomId]) {
            rooms[roomId] = {};
        } else {
            // 既に誰かが遊んでいる部屋なら、現在の最新状態をその人にだけ送る
            socket.emit('syncState', rooms[roomId]);
        }
    });

    // 誰かがブロックを動かしたり、ストックを追加した時の処理
    socket.on('updateState', (newState) => {
        const roomId = socket.roomId;
        if (roomId) {
            rooms[roomId] = newState; // サーバーの記憶を最新に上書き
            // 自分「以外」の、同じ部屋にいる全員に最新状態を送る
            socket.to(roomId).emit('syncState', newState);
        }
    });
});

// 0.0.0.0で起動することで、スマホなど他の端末からもアクセス可能にする
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`サーバーが起動しました！ ポート番号: ${PORT}`);
});