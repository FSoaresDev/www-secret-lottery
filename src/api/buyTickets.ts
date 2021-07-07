import constants from "../constants";
import { IClientState } from "../context/ClientContext";
import entropy from "../utils/entropy";
const { fromUtf8 } = require("@iov/encoding");

export default async (client: IClientState, tokenAddress: string, contractAddress: string, tickets: string[], amount: string) => {
    let msg_json = {
        buy_tickets: {
            entropy: entropy(27),
            tickets
        }
    }
    let msg= btoa(JSON.stringify(msg_json))
    console.log(`{\"buy_tickets\": { \"entropy\": "${entropy(27)}", \"tickets\": [${tickets}]}}`)
    let handleMsg = { send: {recipient: contractAddress, amount, msg} };

    let dynamicFees = 
        tickets.length <= 25 ? feesAmount25Less : 
        tickets.length <= 50 ? feesAmount50Less : 
        tickets.length <= 75 ? feesAmount75Less : 
        tickets.length <= 100 ? feesAmount100Less : 
        tickets.length <= 100 ? feesAmount125Less : 
        tickets.length <= 150 ? feesAmount150Less : 
        tickets.length <= 175 ? feesAmount175Less : 
        tickets.length <= 200 ? feesAmount200Less : 
        tickets.length > 200 ? feesAmount200More : undefined
        
    const response = await client.execute.execute(tokenAddress, handleMsg,undefined,undefined,dynamicFees); 
    return JSON.parse(fromUtf8(response.data))
} 

const feesAmount25Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "1500000",
}
const feesAmount50Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "3000000",
}
const feesAmount75Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "4500000",
}
const feesAmount100Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "5500000",
}
const feesAmount125Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "6500000",
}
const feesAmount150Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "7500000",
}
const feesAmount175Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "8750000",
}
const feesAmount200Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "10000000",
}
const feesAmount200More = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "20000000",
}