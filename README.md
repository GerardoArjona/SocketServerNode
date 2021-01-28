# Simple Socket Server
Simple Socket Server using socket.io and encrypts/decrypts messages with key files

Works with: https://github.com/GerardoArjona/SocketClientNode

## Version & instalation

Minimum requirements

Node: **v12.18**
Npm: **v6.14**

At the project root run

	npm install

## Key generation

Run

	npm run keys

to generate server/client public & private keys.

Copy

- Client public & private keys to **/keys** in *client project*
- Server public key to **/keys** in *client project*

## Execution

	npm run start

