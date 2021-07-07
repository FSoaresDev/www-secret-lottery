import { IClientState } from "../context/ClientContext";
import entropy from "../utils/entropy";
const { fromUtf8 } = require("@iov/encoding");

export default async (client: IClientState, contractAddress: string) => {
    let handleMsg = { create_viewing_key: {entropy: entropy(27)} };
    const response = await client.execute.execute(contractAddress, handleMsg,undefined,undefined,{
        amount: [{ amount: "500000", denom: "uscrt" }],
        gas: "200000",
    });
    return JSON.parse(fromUtf8(response.data))
   

}