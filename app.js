'use strict';
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const rsaWrapper = require('./rsaWrapper');

const checkCommand = command =>{
    if(
        command.trim() === "CONSULTAR" ||
        command.trim() === "SALIR" || 
        command.trim().split(" ")[0] === "DEPOSITAR" || 
        command.trim().split(" ")[0] === "RETIRAR"
    )
        return true
    return false
}

rsaWrapper.initLoadServerKeys(__dirname);
rsaWrapper.serverExampleEncrypt();

app.get('/', (req, res) => {
  res.send('<h1>Server running</h1>');
});


io.on('connection', socket => { 
    socket.on('connected', data =>{
        console.log("MESSAGE: " + data)
    })
    
    socket.on('command', data =>{
        console.log("COMMAND: " + data)
        if(checkCommand(data)){
            io.emit('command_received', `Received`);
            if(data.trim() === "CONSULTAR"){
                let rawdata = fs.readFileSync('client.json');
                let client = JSON.parse(rawdata);
                console.log("CLIENT DATA:");
                console.log(client);
                let clientPublic = fs.readFileSync('keys/client.public.pem');
                // console.log(clientPublic)
                let message = rsaWrapper.encrypt(clientPublic, JSON.stringify(client));
                // console.log(message)
                io.emit('client_data', message);
                   
            }else if(data.trim() === "SALIR"){
                io.emit('disconnect_message', "Connection ended!");
                socket.disconnect(true)
            }else if(data.trim().split(" ")[0] === "DEPOSITAR"){
                // console.log(data.trim().split(" ")[0])
                // console.log(data.trim().split(" ")[1])
                let rawdata = fs.readFileSync('client.json');
                let client = JSON.parse(rawdata);

                let balance = client.balance

                const fileName = './client.json';
                const file = require(fileName);
                    
                file.balance = Number(balance) + Number(data.trim().split(" ")[1]);
                    
                fs.writeFile(fileName, JSON.stringify(file), function writeJSON(err) {
                    if (err) return console.log(err)
                    else{
                        rawdata = fs.readFileSync('client.json');
                        client = JSON.parse(rawdata);
        
                        let new_balance = client.balance

                        let balanceData = {old: balance, new: new_balance}

                        let clientPublic = fs.readFileSync('keys/client.public.pem');
                        // console.log(clientPublic)
                        let message = rsaWrapper.encrypt(clientPublic, JSON.stringify(balanceData));
                        // console.log(message)

                        io.emit('balance_data', message);
                    }
                });
            }else if(data.trim().split(" ")[0] === "RETIRAR"){
                let rawdata = fs.readFileSync('client.json');
                let client = JSON.parse(rawdata);

                let balance = client.balance

                const fileName = './client.json';
                const file = require(fileName);
                    
                file.balance = Number(balance) - Number(data.trim().split(" ")[1]);
                    
                fs.writeFile(fileName, JSON.stringify(file), function writeJSON(err) {
                    if (err) return console.log(err)
                    else{
                        rawdata = fs.readFileSync('client.json');
                        client = JSON.parse(rawdata);
        
                        let new_balance = client.balance

                        let balanceData = {old: balance, new: new_balance}

                        let clientPublic = fs.readFileSync('keys/client.public.pem');
                        // console.log(clientPublic)
                        let message = rsaWrapper.encrypt(clientPublic, JSON.stringify(balanceData));
                        // console.log(message)
        
                        io.emit('balance_data', message);
                    }
                });
            }
        }else{
            io.emit('command_received', `Command not supported`);
        }
        
    })
    
});

http.listen(3000, () => {
  console.log('Listening on port 3000');
});