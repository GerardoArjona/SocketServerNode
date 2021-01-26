const rsaWrapper = require('./rsaWrapper');
// Generando las llaves privadas y publicas a ser usadas por el cliente y el servidor
rsaWrapper.generate('server');
rsaWrapper.generate('client');
console.log('Keys generate...')