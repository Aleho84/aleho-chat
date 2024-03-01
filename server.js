//Requires
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import { Server as IOServer } from 'socket.io';


//Inicializar
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverCertificates = {
    key: fs.readFileSync(path.join(__dirname, './certificates/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, './certificates/cert.pem'))
};

const app = express();
const httpServer = https.createServer(serverCertificates, app);
const ioServer = new IOServer(httpServer);

const Reset = "\x1b[0m";
const Magenta = "\x1b[35m";
const Cyan = "\x1b[36m";


//Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: 'alehochatsecret',
    resave: false,
    saveUninitialized: true
}));

let allMsgs = '';
let clientList = [];
let clientNumber = 0;

ioServer.on('connection', (socket) => {
    const cookie = cookieParser(socket.request.headers.cookie);

    addClient(cookie.sid)
    socket.emit(`server_handshake`)
    socket.emit(`username`, searchClient(cookie.sid).name)
    console.log(`cliente [${Cyan} ${searchClient(cookie.sid).name} - ${cookie.sid}${Reset}] conectado`)

    socket.on('client_handshake', () => {
        allMsgs += `<br>[${searchClient(cookie.sid).name}] conectado`
        ioServer.sockets.emit('chat', allMsgs)
    })

    socket.on('client_message', data => {
        console.log(`cliente [${searchClient(cookie.sid).name}]  -  Mensaje: ${data}`)
        allMsgs += `<br>[${searchClient(cookie.sid).name}] dice: ${data}`
        ioServer.sockets.emit('chat', allMsgs)
    })

    socket.on('clear', () => {
        console.log(`cliente [${Cyan}${searchClient(cookie.sid).name}${Reset}]  -  Clear Request`)
        allMsgs = ''
        ioServer.sockets.emit('chat', allMsgs)
    })

    socket.on('disconnect', () => {
        console.log(`cliente [${Cyan}${searchClient(cookie.sid).name}${Reset}] desconectado`)
        allMsgs += `<br>[${searchClient(cookie.sid).name}] desconectado`
        ioServer.sockets.emit('chat', allMsgs)
    })
});

//Server
const httpPort = process.env.ALEHOCHAT_PORT;
httpServer.listen(httpPort, () => {
    console.log(`Server en puerto:${httpPort}`)
});


// funcion para añadir un cliente nuevo a la memoria (clientList)
function addClient(id) {
    const idExists = clientList.some(obj => obj.id === id);
    if (idExists) { return }

    clientNumber += 1
    clientList.push(
        {
            id: id,
            name: `USER-${clientNumber}`
        }
    );
};

// funcion para buscar un client  en memoria
function searchClient(id) {
    let response = clientList.find(element => element.id === id);
    return response;
};


// parsea el cookieString del header para obtener los valores de cookies del navegador
function cookieParser(cookieString) {
    const cookies = {};

    try {
        cookieString.split(';').forEach((cookie) => {
            const parts = cookie.split('=');
            let key = parts[0].trim();
            if (key === 'connect.sid') { key = 'sid' }
            const value = parts[1].trim();
            cookies[key] = value;
        });
    } catch (error) {
        console.error(`Error al parsear cookies \n coockieString = ${cookieString} \n ${error}`);
    }

    return cookies;
};