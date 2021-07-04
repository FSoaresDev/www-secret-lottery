import { IClientState } from "../context/ClientContext";
import entropy from "../utils/entropy";
const { fromUtf8 } = require("@iov/encoding");

export default async (client: IClientState, contractAddress: string) => {
    let handleMsg = {
        trigger_end_round: {
            entropy: entropy(27)
        }
    };
    const response = await client.execute.execute(contractAddress, handleMsg); 
    return JSON.parse(fromUtf8(response.data))
} 