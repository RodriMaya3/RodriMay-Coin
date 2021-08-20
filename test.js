const Blockchain = require('./blockchain.js');

const rodricoin = new Blockchain(); //makes a new instance (or Brand) of our blockchain data structure (module)

console.log(rodricoin);

//remember .createNewBlock() needs these 3 parameters: nonce, previousBlockHash, hash
rodricoin.createNewBlock(12342, 'Q340NAPGAGB', 'AAJABJSABBOB0');
rodricoin.createNewBlock(5365, 'UJJAGJIAJIAD', 'PAJJDKJJJJ');
rodricoin.createNewBlock(86376, 'GYYY899UB0A9', 'ZJJPAJPOGOIOI');
rodricoin.createNewBlock(128342, 'Q3aa40NAPsaGAGB', 'AAJABassJSABBOB0');
rodricoin.createNewBlock(53625, 'UJJAGJaIAJIAD', 'PAJJsaaDKJJJJ');
rodricoin.createNewBlock(86976, 'GYYY8ds99UB0A9', 'ZJJPasaAJPOGOIOI');
rodricoin.createNewBlock(123042, 'Q340NAPGAGB', 'AAJABssaJSABBOB0');
rodricoin.createNewBlock(53765, 'UJJAGJasIAJIAD', 'PAJJDKJJJJ');
rodricoin.createNewBlock(86786, 'GYYY89as9UB0A9', 'ZJJasPAJPOGOIOI');

rodricoin.createNewTransaction(100, 'SEND9AB8AJBAPDI', 'asd');
rodricoin.createNewTransaction(101, 'SEND9AB8AJASBAPDI', 'asasfsdggfdfg');
rodricoin.createNewTransaction(102, 'SEND9AB8AJBaAPDI', 'RECAOIJBasAB0SSA');
rodricoin.createNewTransaction(104, 'SEND9AB8AJBdfsfAPDI', 'RECAOIadsJBAB0SSA');
rodricoin.createNewTransaction(105, 'SEND9AB8AJBsasAPDI', 'RECAOIJsadBAB0SSA');
rodricoin.createNewTransaction(106, 'SEND9AB8AsAJBAPDI', 'RECAOIJBAasB0SSA');
rodricoin.createNewTransaction(107, 'SEND9AB8AsJBAAPDI', 'RECAOIJBasdAB0SSA');
rodricoin.createNewTransaction(108, 'SEND9AB8ASBAPDI', 'RECAOIJBABsdas0SSA');
rodricoin.createNewTransaction(109, 'SEND9ABss8AJBAPDI', 'RECAOIJBsdAB0SSA');

const previousBlockHash = 'A9089AUD8A8UA8GSDA';
const currentBlockData = [{
        "amount": 50,
        "sender": "ALEX00IIO99GHAHBA1",
        "recipient": "RODRIGOOOIJOI9ABAABAS1",
    },
    {
        "amount": 150,
        "sender": "ALEX00IIO99GHAHBA2",
        "recipient": "RODRIGOOOIJOI9ABAABAS2",
    },
    {
        "amount": 5,
        "sender": "ALEX00IIO99GHAHBA3",
        "recipient": "RODRIGOOOIJOI9ABAABAS3",
    }
];
//const nonce = 100;

//console.log(rodricoin.hashBlock(previousBlockHash, currentBlockData, nonce));

let nonce = rodricoin.proofOfWork(previousBlockHash, currentBlockData);
console.log('nonce from Proof of Work : ' + nonce);

console.log(rodricoin.hashBlock(previousBlockHash, currentBlockData, nonce));

console.log(rodricoin);

//console.log(rodricoin.chain[8].nonce);
//console.log(rodricoin.chain[3+1].nonce);
//console.log(rodricoin);
//console.log(rodricoin.chain[2]);
//console.log(rodricoin.newTransactions[1].amount+rodricoin.newTransactions[2].amount);
//console.log(rodricoin.chain[2+2]);




