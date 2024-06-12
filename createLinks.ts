import { ZkSendLinkBuilder, listCreatedLinks } from '@mysten/zksend';
import * as fs from 'fs';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair, Ed25519KeypairData } from '@mysten/sui/keypairs/ed25519';

const ONE_SUI = 1_000_000_000;

const client = new SuiClient({ url: getFullnodeUrl("mainnet") });
//fix later const keypair = fs.readFileSync("keypair.json");

//numSui is amt of sui per link
async function createLinks(keypair: Ed25519Keypair, numLinks: number, numSui: bigint) {
    const links: ZkSendLinkBuilder[] = [];
    for (let i = 0; i < numLinks; i++) {
        const link = new ZkSendLinkBuilder({
            sender: keypair.toSuiAddress(),
        });

        link.addClaimableMist(numSui);
        links.push(link);
    }
    const urls = links.map((link) => link.getLink());
    
    const tx = await ZkSendLinkBuilder.createLinks({
        links: links
    });
    
    let result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair
    });
    console.log("tx response:", result);
    return urls
}

//buggy for some reason, does not work
async function getMadeLinks(keypair: Ed25519Keypair) {
    const { links, hasNextPage, cursor } = await listCreatedLinks({
        address: keypair.toSuiAddress(),
        client: client
    });
    console.log("links field:\n",links);
}

async function main() {
    const args = process.argv.slice(2); // Slicing to skip the first two elements
    const NUM_LINKS: number = parseInt(args[0]);
    const NUM_SUI: bigint = BigInt(parseFloat(args[1]) * ONE_SUI);
    
    //reading in the keypair
    const data = fs.readFileSync('keypair.json', 'utf8');
    const keypairJSON = JSON.parse(data);
    let pubKey = new Uint8Array(keypairJSON.keypair.publicKey);
    let secKey = new Uint8Array(keypairJSON.keypair.secretKey);
    let keypairData: Ed25519KeypairData = {
        publicKey: pubKey,
        secretKey: secKey
    };
    let funder = new Ed25519Keypair(keypairData);
    console.log("funder address: ", funder.toSuiAddress());

    let test = await createLinks(funder, NUM_LINKS, NUM_SUI);
    console.log(test);
}

if(require.main == module) {
    main();
}