import { IClientState } from "../context/ClientContext";

export default async (
    client: IClientState,
    contractAddress: string,
    key: string,
    round_numbers: number[]
) => {
    try {
        let queryMsg = { get_user_tickets: { address: client.accountData.address, key, round_numbers } };
        const response = await client.execute.queryContractSmart(contractAddress, queryMsg);
        return JSON.parse(atob(response)).get_user_tickets
    } catch (e){
        if(e.message.includes("User+VK not valid!")){
            localStorage.clear();
        }
        return {
            user_tickets: []
        }
    }
}

export interface IUserTicket {
    round_number: number,
    ticket: string,
    created_timestamp: number,
    claimed_reward: boolean,
    claimed_timestamp: number | null
}