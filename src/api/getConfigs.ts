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
    base_ticket_price: string,
    prize_pool_allocations: {
        triggerer: number,
        burn: number,
        sequence_1: number,
        sequence_2: number,
        sequence_3: number,
        sequence_4: number,
        sequence_5: number,
        sequence_6: number,
    }
}