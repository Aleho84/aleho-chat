const socket = io()
const input = document.querySelector("#input")
const button = document.querySelector("#button")
const clear = document.querySelector("#clear")
const username = document.querySelector("#username")

//EventListener
input.addEventListener('keyup', (event) => {
    if (event.keyCode == 13) {
        button.click()
        input.value = ''
    }
})

button.addEventListener('click', (event) => {
    socket.emit('client_message', input.value)
    input.value = ''
})

clear.addEventListener('click', (event) => {
    socket.emit('clear')
})


//Socket Events
socket.on('server_handshake', data => {
    socket.emit('client_handshake')
    document.getElementById("chat").innerHTML = data
})

socket.on('username', data => {
    document.getElementById("username").innerHTML = data
})

socket.on('chat', data => {
    document.getElementById("chat").innerHTML = data
})