import constants from "../constants";

export default async (myAddress: string) => {
    const permitName = "secret_lottery_" + new Date().getTime();
    const allowedTokens = [constants.SECRET_LOTTERY_CONTRACT_ADDRESS];
    const permissions = ["owner"];

    const { signature } = await window.keplr.signAmino(
        constants.CHAIN_ID,
        myAddress,
        {
            chain_id: constants.CHAIN_ID,
            account_number: "0", // Must be 0
            sequence: "0", // Must be 0
            fee: {
                amount: [{ denom: "uscrt", amount: "0" }],  // Must be 0 uscrt
                gas: "1",  // Must be 1
            },
            msgs: [
                {
                    type: "query_permit",  // Must be "query_permit"
                    value: {
                        permit_name: permitName,
                        allowed_tokens: allowedTokens,
                        permissions: permissions,
                    },
                },
            ],
            memo: "",  // Must be empty
        },
        {
            preferNoSetFee: true, // Fee must be 0, so hide it from the user
            preferNoSetMemo: true, // Memo must be empty, so hide it from the user
        }
    );

    return {
        params: {
            permit_name: permitName,
            allowed_tokens: allowedTokens,
            chain_id: constants.CHAIN_ID,
            permissions: permissions,
        },
        signature: signature,
    }
}
