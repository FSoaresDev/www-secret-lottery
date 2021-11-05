import { IClientState } from "../context/ClientContext";

export default async (
    client: IClientState,
    contractAddress: string,
    permit: any,
    round_number: number,
    page: number,
    page_size: number
) => {
    try {
        let queryMsg = {
            with_permit: {
                query: { get_user_round_paginated_tickets: { round_number, page, page_size } },
                permit
            },

        };
        console.log(queryMsg)
        const response = await client.execute.queryContractSmart(contractAddress, queryMsg);
        console.log(response)
        return response.get_user_round_paginated_tickets
        //const responseJSON = JSON.parse(atob(response)).get_user_round_paginated_tickets
        //return responseJSON
    } catch (e: any) {
        if (e.message.includes("User+VK not valid!")) {
            localStorage.clear();
            window.location.reload();
        }
        return {
            get_user_round_paginated_tickets: []
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