const sha256 = require('js-sha256');
const currentNodeUrl = process.argv[3];
const { v4: uuidv4 } = require('uuid');


function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];

    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];

    this.createNewBlock(100, '0', '0');
    //pass in arbitrary parameters, the only time this should be done is here for the GENESIS BLOCK

};

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash
    };

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
};

Blockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length - 1];
};

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
    const newTransaction = {
        //create a newTransaction object
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuidv4().split('-').join('')
    };

    return newTransaction;
};

Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj) {
    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
    //gets the index of the last block of our chain plus one, for a new block

}

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
};

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== '0000') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
};

Blockchain.prototype.proofOfWorkEasy = function(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    while (hash.substring(0, 1) !== '0') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        // console.log('previousBlockHash:' + previousBlockHash + 'currentBlockData' + currentBlockData);
        // console.log('nonce:' + nonce + 'hash:' + hash);
    }

    return nonce;
}

Blockchain.prototype.chainIsValid = function(blockchain) {

    let validChain = true;

    // console.log('how we doing?', validChain);
    // console.log('what/s our bc length?', blockchain.length)

    for (var i = 1; i < blockchain.length; i++) {
        // console.log(i);
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i - 1];
        const blockHash =
            this.hashBlock(prevBlock['hash'], {
                    transactions: currentBlock['transactions'],
                    index: currentBlock['index']
                },
                currentBlock['nonce']
            );

        if (blockHash.substring(0, 4) != "0000") validChain = false;
        // console.log(blockHash.substring(0, 4));
        // console.log('got 0000s?', validChain);

        if (currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false; //chain not valid

        // console.log('got matched hashes to last one?', currentBlock['previousBlockHash'], prevBlock['hash'], validChain);

        // console.log("previousBlockHash==>", prevBlock['hash']);
        // console.log("currentBlockHash ==>", currentBlock['hash']);


    };
    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 100;
    const correctPreviousHash = genesisBlock['previousBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    // console.log(correctNonce, correctPreviousHash, correctHash, correctTransactions);
    // console.log("genesis block hash", genesisBlock['hash'])

    if (!correctNonce || !correctPreviousHash || !correctHash || !correctTransactions) validChain = false;


    return validChain; //true if valid, false if not valid 

}

Blockchain.prototype.getBlock = function(blockHash) {
    let correctBlock = null;
    this.chain.forEach(block => {
        if (block.hash === blockHash) correctBlock = block;
    });
    return correctBlock;
}

Blockchain.prototype.getTransaction = function(transactionId) {
    let correctTransaction = null;
    let correctBlock = null; //cuz we want to know which block the t/x is in too 

    //loop through every block 
    this.chain.forEach(block => {
        //now loop through each t/x in that block
        block.transactions.forEach(transaction => {
            if (transaction.transactionId === transactionId) {
                correctTransaction = transaction;
                correctBlock = block;
            }
        });
    });
    return {
        transaction: correctTransaction,
        block: correctBlock
    }
}

Blockchain.prototype.getAddressData = function(address) {
    //we take in an address, so we have to collect all the t/x into a single array
    const addressTransactions = [];
    //new we cycle through all t/x and look in both sender & receiver to match the passed in address
    this.chain.forEach(block => {
        //now cycle through all t/x per block
        block.transactions.forEach(transaction => {
            //now we have access to every single t/x and we test each for sender or recipient
            if (transaction.sender === address || transaction.recipient === address) addressTransactions.push(transaction); //add it to our array if it matches
        });
    });
    //upon commpletion, we've loaded up the array. Now we have to figure out the balance is for this address
    let balance = 0; //would you do this for you bank? 
    addressTransactions.forEach(transaction => {
        if (transaction.recipient === address) balance += transaction.amount;
        else if (transaction.sender === address) balance -= transaction.amount;
    });

    return {
        addressTransactions: addressTransactions,
        addressBalance: balance
    };

}


module.exports = Blockchain;


