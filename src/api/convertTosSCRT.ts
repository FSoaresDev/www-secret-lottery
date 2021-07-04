import { IClientState } from "../context/ClientContext";
import entropy from "../utils/entropy";
const { fromUtf8 } = require("@iov/encoding");

export default async (client: IClientState, contractAddress: string) => {
    let handleMsg = { deposit: {} };
    const response = await client.execute.execute(contractAddress, handleMsg, undefined, [{denom: "uscrt", amount: "10000000"}]);
    return JSON.parse(fromUtf8(response.data))
}