//this file is our blockchain data structure + f/n 

//dependency requirement
const sha256 = require('js-sha256');

const currentNodeUrl = process.argv[3];
const { v4: uuidv4 } = require('uuid');


//this is a 'constructor' function...data object 
function Blockchain() {
    this.chain = []; //initialize the chain to an empty array. We will store all of our blocks here. 
    this.pendingTransactions = []; //hold all the new t/x before they are "mined" into a block 

    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];

    this.createNewBlock(100, '0', '0'); //GENESIS BLOCK! 
};

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
    //all of these terms will  soon be revealed
    const newBlock = {
        index: this.chain.length + 1,
        //what block is this in our chain. first, or 1000th? 
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        //all of the t/x in this block
        nonce: nonce,
        //a nonce is a number only used once (2, 10, 1232349). this is the PROOF that we actually created a legit. block 
        hash: hash,
        //this data from our new block.
        previousBlockHash: previousBlockHash
            //data from our current block hashed into a string
    };

    this.pendingTransactions = [];
    //clears out any pendingTransactions
    this.chain.push(newBlock);
    //add the newBlock the the chain 

    return newBlock;
}

Blockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length - 1];
}

//Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj) {
//this.pendingTransactions.push(transactionObj);
//return this.getLastBlock()['index'] + 1;
//     //gets the index of the last block of our chain plus one, for a new block

// }

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
    //create a newTransaction object
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient
    };

    //add the newTx to the newTx data area
    this.pendingTransactions.push(newTransaction);

    return this.getLastBlock()['index'] + 1;
    //get the index of the last block of our chain plus one, for a new block. 
}

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {

    //smoosh all of our 3 parameters into one long string
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);

    //pass all of our data as a string into our new, cool js-sha256 library/package/dependency 
    const hash = sha256(dataAsString);

    return hash;

    //what does this method do? take the blockData ==> some hash result
    //for example: "cat" ==> 77af778b51abd4a3c51c5ddd97204a9c3ae614ebccb75a606c3b6865aed6744e

}

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData) {
    //hashing = previous Block + current Block + nonce 
    //set our difficulty level: hash has to start with 0 or 00 or 000 or 0000 
    //brute force, increment nonce & run the hash until we are happy (happy = hash satisfies the business rule/difficulty level)

    let nonce = 0; //start are zero, use the let keyword 'cuz this is gonna change.

    //create a hash running the hashBlock() method with our default nonce of zero
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    //execute the code {...} while this condition is true
    //while the first four digits of the hash are NOT 0000
    /* in javaScript 
     = means to assign a value. sha256 = require('js-sha256'); 
     == comparison. does 3 == 5, are they the same. result: false
     !== comparison. not equal. 3 !== 5, result: true 
     !== 3 !==3 result: false 
     (=== means do they equal and are the the same DATA TYPE)
    */
    while (hash.substring(0, 4) !== '0000') {
        nonce++; // nonce = nonce + 1... 0 + 1 = 1. 1+1 = 2... 
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
};

module.exports = Blockchain;



