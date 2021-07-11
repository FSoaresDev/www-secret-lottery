import { IClientState } from "../context/ClientContext";
const { fromUtf8 } = require("@iov/encoding");

export default async (
    client: IClientState,
    contractAddress: string,
) => {
    let queryMsg = { get_configs: { } };
    const response = await client.execute.queryContractSmart(contractAddress, queryMsg);
    return JSON.parse(atob(response)).get_configs
}

export interface Configs {
    triggerer: string,
    token: {
        address: string,
        contract_hash: string
    },
    reward_token: {
        address: string,
        contract_hash: string
    },
    token_info: {
        name: string,
        symbol: string
    },
    current_round_number: number,
    per_ticket_bulk_discount: number
}