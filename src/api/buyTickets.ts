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
    const response = await client.execute.execute(tokenAddress, handleMsg); 
    return JSON.parse(fromUtf8(response.data))
} 