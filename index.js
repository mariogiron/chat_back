// Server creation and configuration
const http = require('http');
const app = require('./src/app');
const ChatMessage = require('./src/models/chat-message.model');

// Config .env
require('dotenv').config();

// Config DB
require('./src/config/db');

// Server creation
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT);

// Listeners
server.on('listening', () => {
    console.log(`Server listening on port ${PORT}`);
});

server.on('error', (error) => {
    console.log(error);
});

// Config WS Server
const io = require('socket.io')(server, {
    cors: {
        origin: '*'
    }
});

io.on('connection', async (socket) => {
    console.log('Se ha conectado un nuevo cliente');

    // Recuperar los 5 últimos mensajes de la BD
    const arr = await ChatMessage.find().sort({ createdAt: -1 }).limit(5);

    socket.emit('chat_init', {
        message: 'Conexión realizada con éxito',
        socketId: socket.id,
        chatMessages: arr
    });

    // Enviar un mensaje desde el servidor a todos los clientes conectados, menos al que se conecta, informando de la nueva conexión
    socket.broadcast.emit('chat_message_server', {
        username: 'INFO',
        message: 'Se ha conectado un nuevo usuario'
    });

    // Emitir el número de clientes conectado al servidor
    io.emit('clients_online', io.engine.clientsCount);

    socket.on('chat_message_client', async (data) => {
        // console.log(data);
        await ChatMessage.create(data);
        io.emit('chat_message_server', data);
    });

    socket.on('disconnect', () => {
        io.emit('chat_message_server', {
            username: 'INFO',
            message: 'Se ha desconectado un usuario'
        });
        io.emit('clients_online', io.engine.clientsCount);
    });

});