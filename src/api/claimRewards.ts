import { IClientState } from "../context/ClientContext";
import entropy from "../utils/entropy";
const { fromUtf8 } = require("@iov/encoding");

export default async (client: IClientState, contractAddress: string,  round: number, tickets_index: number[]) => {
    let handleMsg = {
        claim_rewards: {
            round,
            tickets_index
        }
    };
    const response = await client.execute.execute(contractAddress, handleMsg); 
    return JSON.parse(fromUtf8(response.data))
} 