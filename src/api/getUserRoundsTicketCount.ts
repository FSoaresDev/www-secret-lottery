import { IClientState } from "../context/ClientContext";

export default async (
    client: IClientState,
    contractAddress: string,
    permit: any,
    round_numbers: number[]
) => {
    try {
        let queryMsg = {
            with_permit: {
                query: { get_user_rounds_ticket_count: { round_numbers } },
                permit
            }
        }
        const response = await client.execute.queryContractSmart(contractAddress, queryMsg);
        const responseJSON = JSON.parse(atob(response)).get_user_rounds_ticket_count
        return responseJSON
    } catch (e: any) {
        if (e.message.includes("User+VK not valid!")) {
            localStorage.clear();
            window.location.reload();
        }
        return {
            user_rounds_ticket_count: []
        }
    }
}