const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain.js');
const { v4: uuidv4 } = require('uuid');
const port = process.argv[2]; //accesses our port variable in our network node
const rp = require('request-promise');

const nodeAddress = uuidv4().split('-').join('');

const rodricoin = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/blockchain', function(req, res) {
    res.send(rodricoin);
});

app.post('/transaction', function(req, res) {
    const newTransaction = req.body;
    const blockIndex = rodricoin.addTransactionToPendingTransactions(newTransaction); //this returns the index
    res.json({ note: `transaction will be added in block ${blockIndex} ` });

    // example code from earlier steps
    // console.log(req.body);
    // res.send(`The amount of the transaction is ${req.body.amount} bearcoin`);

    //removed after step #50 once we refactor
    // const blockIndex = bearcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    // res.json({ note: `Transaction is added in block ${blockIndex}.` });


});

app.post('/transaction/broadcast', function(req, res) {
    const newTransaction = rodricoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);

    rodricoin.addTransactionToPendingTransactions(newTransaction);

    const requestPromises = [];
    rodricoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
        .then(data => {
            res.json({ note: 'transaction created and broadcast successfully' })
        });
});

app.get('/mine', function(req, res) {
    const lastBlock = rodricoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: rodricoin.pendingTransactions,
        index: lastBlock['index'] + 1
    };

    const nonce = rodricoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = rodricoin.hashBlock(previousBlockHash, currentBlockData, nonce);

    //this is the mining reward transaction 
    //muted here to move to broadcast portion 
    //bearcoin.createNewTransaction(6.25, "00", nodeAddress);

    const newBlock = rodricoin.createNewBlock(nonce, previousBlockHash, blockHash);
    const requestPromises = [];

    rodricoin.networkNodes.forEach(networkNodeUrl => {
        console.log(networkNodeUrl);
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { newBlock: newBlock },
            json: true
        }
        requestPromises.push(rp(requestOptions));
    });
    Promise.all(requestPromises)
        .then(data => {
            const requestOptions = {
                uri: rodricoin.currentNodeUrl + '/transaction/broadcast',
                method: 'POST',
                body: {
                    amount: 6.25,
                    sender: "00",
                    recipient: nodeAddress
                },
                json: true
            }
            return rp(requestOptions);
        })
        .then(data => {
            res.json({
                note: 'new block mined and broadcast successfully',
                block: newBlock
            });
        });
});

app.post('/receive-new-block', function(req, res) {
    const newBlock = req.body.newBlock;
    const lastBlock = rodricoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

    if (correctHash && correctIndex) {
        rodricoin.chain.push(newBlock);
        rodricoin.pendingTransactions = [];
        res.json({
            note: 'new block received and accepted',
            'newBlock': newBlock
        });
    } else {
        res.json({
            note: 'new block rejected',
            newBlock: newBlock
        })
    }
});

//register a node and broadcast that node to the entire network
app.post('/register-and-broadcast-node', function(req, res) {
    const newNodeUrl = req.body.newNodeUrl;

    if (rodricoin.networkNodes.indexOf(newNodeUrl) == -1) rodricoin.networkNodes.push(newNodeUrl);

    const regNodesPromises = [];

    rodricoin.networkNodes.forEach(networkNodeUrl => {
        //hit the register node endpoint
        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl: newNodeUrl },
            json: true
        }
        regNodesPromises.push(rp(requestOptions));
    });
    Promise.all(regNodesPromises)
        .then(data => {
            //use the data
            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: { allNetworkNodes: [...rodricoin.networkNodes, rodricoin.currentNodeUrl] },
                json: true
            }
            return rp(bulkRegisterOptions);
        })
        .then(data => {
            res.json({ note: 'new node registered with network successfully' });
        });

});

//register a node with the network
app.post('/register-node', function(req, res) {
    const newNodeUrl = req.body.newNodeUrl; //take the new node url from the body
    const nodeNotAlreadyPresent = rodricoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = rodricoin.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) rodricoin.networkNodes.push(newNodeUrl);
    res.json({ note: 'new node registered successfully' });
});

//register multiple nodes at once
app.post('/register-nodes-bulk', function(req, res) {
    const allNetworkNodes = req.body.allNetworkNodes;

    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = rodricoin.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = rodricoin.currentNodeUrl !== networkNodeUrl;
        if (nodeNotAlreadyPresent && notCurrentNode) rodricoin.networkNodes.push(networkNodeUrl);
    });
    res.json({ note: 'bulk registration successful' });
});

app.get('/consensus', function(req, res) {
    const requestPromises = [];

    //the first thing we do is make requests to all the other nodes on the network. 
    rodricoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/blockchain',
            method: "GET", //has no body on a get request
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    //this loads up our array of all the blockchains 
    Promise.all(requestPromises)
        .then(blockchains => {
            //this blockchains is an array of all the other blockchains from all the other nodes
            //now we iterate through to see which is the longest

            //we've got to set up some tracking variables for the loop to follow 
            const currentChainLength = rodricoin.chain.length;
            let maxChainLength = currentChainLength;
            let newLongestChain = null;
            let newPendingTransactions = null;

            //we iterate through all the blockchains in our nw looking for the longest one
            blockchains.forEach(blockchain => {
                //which is the longest? is any longer than ours? 
                if (blockchain.chain.length > maxChainLength) {
                    //this one is longer, so change up some variables
                    maxChainLength = blockchain.chain.length;
                    newLongestChain = blockchain.chain;
                    newPendingTransactions = blockchain.pendingTransactions;
                };

            });

            //now, if there wasn't a longer chain than ours, we do not replace. 
            //newLongestChain would remain null or if a longer invalid one was found...
            if (!newLongestChain || (newLongestChain && !rodricoin.chainIsValid(newLongestChain))) {
                res.json({
                    note: 'Current chain has not been replaced.',
                    chain: rodricoin.chain,
                });
                // } else if (newLongestChain && bearcoin.chainIsValid(newLongestChain)) {
            } else {
                //here we found a longer one so we replace ours with the longer one.
                rodricoin.chain = newLongestChain;
                rodricoin.pendingTransactions = newPendingTransactions;
                res.json({
                    note: 'This chain has  been replaced.',
                    chain: rodricoin.chain,
                });
            }
        });

});

app.get('/block/:blockHash', function(req, res) {
    //send in a block hash and get the block back

    //first thing is to access the passed in paramter
    //e.g. localhost:300X/block/890DSDSIJO998DDSDSB88BDSDS
    const blockHash = req.params.blockHash;

    //invoke our method to get null or the correct block 
    const correctBlock = rodricoin.getBlock(blockHash);
    res.json({
        block: correctBlock
    });
});

app.get('/transaction/:transactionId', function(req, res) {
    //send in a t/x id and get back the t/x details
    const transactionId = req.params.transactionId;
    const transactionData = rodricoin.getTransaction(transactionId); //this gives us the t/x and the block as an object
    res.json({
        transaction: transactionData.transaction,
        block: transactionData.block
    });
});

app.get('/address/:address', function(req, res) {
    //send in a specific address and get all the t/x associated with it: sent or received and the balance of this address' account
    const address = req.params.address;
    const addressData = rodricoin.getAddressData(address); //we get an object{} w t/x 
    res.json({
        addressData: addressData
    })
});

app.get('/block-explorer', function(req, res) {
    res.sendFile('./block-explorer/index.html', { root: __dirname }); //this 2nd argument says look into this directory we are already in and find that 1st file path. 
});

app.listen(port, function() {

    console.log(`Listening on port ${port} ...`);
});