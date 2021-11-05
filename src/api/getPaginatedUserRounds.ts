import { IClientState } from "../context/ClientContext";
import { IRound } from "./getRounds";

export default async (
    client: IClientState,
    contractAddress: string,
    permit: any,
    page: number,
    page_size: number
) => {
    try {
        let queryMsg = {
            with_permit: {
                query: { get_paginated_user_rounds: { page, page_size } },
                permit
            },
        }
            ;

        const response = await client.execute.queryContractSmart(contractAddress, queryMsg);
        return response.get_paginated_user_rounds
    } catch (e: any) {
        console.log(e)
        if (e.message.includes("User+VK not valid!")) {
            localStorage.clear();
            window.location.reload();
        }
        return null
    }
}

export interface IPaginatedUserRounds {
    user_tickets_count: number[],
    rounds: IRound[],
    user_tickets_round_total_count: number
}