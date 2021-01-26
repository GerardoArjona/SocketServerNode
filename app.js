// Importamos lo modulos necesarios
'use strict';
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const rsaWrapper = require('./rsaWrapper');

// Función que verifica que el comando 
// recibido desde el cliente es un comando válido
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

// Carga las llaves y corre el escenario de prueba para
// verificar que la configuración de estas es correcta
rsaWrapper.initLoadServerKeys(__dirname);
rsaWrapper.serverExampleEncrypt();

// Endpoint disponible para verificar que el servidor funciona correctamente
app.get('/', (req, res) => {
  res.send('<h1>Server running</h1>');
});

// Accciones a realizar si el socket connection fue exitoso
io.on('connection', socket => { 
    //Accion a realizar cuando se conecte un cliente mostar un mensaje por pantalla
    socket.on('connected', data =>{
        console.log("MESSAGE: " + data)
    })
    
    // Acción a realizar cuando el cliente mande un comando
    socket.on('command', data =>{
        //Descifrar el comando mandado por el cliente
        let serverPrivate = fs.readFileSync('keys/server.private.pem');
        data = rsaWrapper.decrypt(serverPrivate, data);
        console.log("COMMAND: " + data)
        //Verificar que el comando sea válido
        if(checkCommand(data)){
            //Notificar al cliente que el comando fue recibido
            io.emit('command_received', `Received`);
            //Comando CONSULTAR:
            if(data.trim() === "CONSULTAR"){
                // Obtener la información guardada en el json cliente,
                // cifrarla y mandarla al cliente
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
                // Obtener la información guardada en el json client,
                // agregar el monto mandado por el cliente al balance actual
                // guardar el nuevo balance en el json
                // cifrar los balances para ser mandados al cliente
                //  y mandar al cliente

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
                // Obtener la información guardada en el json client,
                // restar el monto mandado por el cliente al balance actual,
                // verificar que el balance actual no llegue a un número negativo,
                // guardar el nuevo balance en el json
                // cifrar los balances para ser mandados al cliente
                //  y mandar al cliente

                let rawdata = fs.readFileSync('client.json');
                let client = JSON.parse(rawdata);

                let balance = client.balance

                const fileName = './client.json';
                const file = require(fileName);
                    
                let newBalance = Number(balance) - Number(data.trim().split(" ")[1]);

                if(newBalance > 0){
                    file.balance = newBalance
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
                }else{
                    let balanceData = {old: balance, new: balance, error: true}
                    let clientPublic = fs.readFileSync('keys/client.public.pem');
                    // console.log(clientPublic)
                    let message = rsaWrapper.encrypt(clientPublic, JSON.stringify(balanceData));
                    // console.log(message)
    
                    io.emit('balance_data', message);
                }
                    
            }
        }else{
            // Envíar un mensaje al cliente cuando se ingrese un comando no soportado
            io.emit('command_received', `Command not supported`);
        }
        
    })
    
});

//Se ejecuta el servidor en el puerto 3000
http.listen(3000, () => {
  console.log('Listening on port 3000');
});