const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

// Menyimpan data semua pemain yang sedang online
let players = {};

io.on('connection', (socket) => {
    console.log('User terhubung: ' + socket.id);

    // Buat data pemain baru saat login
    players[socket.id] = {
        id: socket.id,
        x: 0, y: 0.75, z: 0,
        ry: 0,
        hp: 100,
        color: Math.random() * 0xffffff // Warna acak buat tiap player
    };

    // Kirim data pemain yang sudah ada ke pemain baru
    socket.emit('currentPlayers', players);

    // Beritahu pemain lain ada pemain baru masuk
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Update posisi dari client
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].z = movementData.z;
            players[socket.id].ry = movementData.ry;
            // Kirim ulang posisi terbaru ke semua orang
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Logika PVP: Jika seseorang menyerang
    socket.on('attack', (targetId) => {
        if (players[targetId]) {
            players[targetId].hp -= 10;
            console.log(targetId + " terkena hit! HP: " + players[targetId].hp);
            
            if (players[targetId].hp <= 0) {
                players[targetId].hp = 100; // Reset HP
                io.emit('playerRespawn', targetId);
            }
            io.emit('updateHP', { id: targetId, hp: players[targetId].hp });
        }
    });

    // Hapus data jika disconnect
    socket.on('disconnect', () => {
        console.log('User keluar: ' + socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
