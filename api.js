//this is our blockchain SERVER: expose our blockhain f/n to the web  browser
const Blockchain = require('./blockchain.js');
const bodyParser = require('body-parser');
const rodricoin = new Blockchain();
const { v4: uuidv4 } = require('uuid');

const nodeAddress = uuidv4().split('-').join('');


const express = require('express')
const app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', function(req, res) {
    res.send('Hello World')
})

app.get('/blockchain', function(req, res) {
    //this will display our total blockchain 
    //  res.send('Hello, Blockchain Build on JavaScript (Node.js & Express.js)');
    res.send(rodricoin);
    //res = the SERVERS/API's response 
})

app.post('/transaction', function(req, res) {
    //this will "send in" our transaction  

    const blockIndex = rodricoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);

    res.json({ note: `Transaction is added in block ${blockIndex}.` });
})

app.get('/mine', function(req, res) {
    const lastBlock = rodricoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: rodricoin.pendingTransactions,
        index: lastBlock['index'] + 1
    };

    const nonce = rodricoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = rodricoin.hashBlock(previousBlockHash, currentBlockData, nonce);

    rodricoin.createNewTransaction(6.25, "00", nodeAddress);

    const newBlock = rodricoin.createNewBlock(nonce, previousBlockHash, blockHash);
    res.json({
        note: "new block mined successfully",
        block: newBlock
    });
});



app.listen(3000, function() {
    console.log('Listening on port 3000...');

})