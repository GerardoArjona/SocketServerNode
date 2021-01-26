const path = require('path');
const rsaWrapper = {};
const fs = require('fs');
const NodeRSA = require('node-rsa');
const crypto = require('crypto');

// Generar las llaves necesarias
rsaWrapper.generate = (direction) => {
    let key = new NodeRSA();
    // 65537 — largo de la llave
    key.generateKeyPair(2048, 65537);
    // Salvar llaves como archivos pem en pkcs8
    fs.writeFileSync(path.resolve(__dirname, 'keys', direction + '.private.pem'), key.exportKey('pkcs8-private-pem'));
    fs.writeFileSync(path.resolve(__dirname, 'keys', direction + '.public.pem'), key.exportKey('pkcs8-public-pem'));
    return true;
};

// Cifrando RSA usando padding OAEP con Crypto de NodeJs
rsaWrapper.encrypt = (publicKey, message) => {
    //console.log(publicKey)
    let enc = crypto.publicEncrypt({
    key: publicKey,
    padding: crypto.RSA_PKCS1_OAEP_PADDING
    }, Buffer.from(message));
    return enc.toString('base64');
};

// Descifrando RSA usando padding OAEP con Crypto de NodeJs:
rsaWrapper.decrypt = (privateKey, message) => {
    let enc = crypto.privateDecrypt({
    key: privateKey,
    padding: crypto.RSA_PKCS1_OAEP_PADDING
    }, Buffer.from(message, 'base64'));
    return enc.toString();
};

// Cargando las llaves RSA en variables
rsaWrapper.initLoadServerKeys = (basePath) => {
    rsaWrapper.serverPub = fs.readFileSync(path.resolve(basePath, 'keys', 'server.public.pem'));
    rsaWrapper.serverPrivate = fs.readFileSync(path.resolve(basePath, 'keys', 'server.private.pem'));
    rsaWrapper.clientPub = fs.readFileSync(path.resolve(basePath, 'keys', 'client.public.pem'));
};

// -- Ejecutar el caso de prueba de encrypt RSA --
// El mensaje es cifrado y mostrado en consola,
// posteriormente es descifrado y mostrado en consola
rsaWrapper.serverExampleEncrypt = () => {
    console.log('Server public encrypting');
    let enc = rsaWrapper.encrypt(rsaWrapper.serverPub, 'Testing keys at server init: Correct!');
    console.log('Server private encrypting...');
    console.log('Encrypted RSA string ', '\n', enc);
    let dec = rsaWrapper.decrypt(rsaWrapper.serverPrivate, enc);
    console.log('Decrypted RSA string...');
    console.log(dec);
};

module.exports = rsaWrapper;