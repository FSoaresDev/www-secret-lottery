import { IClientState } from "../context/ClientContext";
import { IRound } from "./getRounds";
import { IUserTicket } from "./getUserTickets";

export default async (
    client: IClientState,
    contractAddress: string,
    key: string,
    page: number,
    page_size: number
) => {
    try {
        let queryMsg = { get_paginated_user_tickets: { address: client.accountData.address, key: key, page, page_size } };
        const response = await client.execute.queryContractSmart(contractAddress, queryMsg);
        const responseJSON = JSON.parse(atob(response)).get_paginated_user_tickets
        return responseJSON
    } catch (e){
        if(e.message.includes("User+VK not valid!")){
            localStorage.clear();
            window.location.reload();
        }
        return null
    }
}

export interface IPaginatedUserTickets {
    user_tickets: IUserTicket[][],
    rounds: IRound[],
    user_tickets_round_total_count: number
}