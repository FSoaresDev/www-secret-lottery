import { IClientState } from "../context/ClientContext";
import entropy from "../utils/entropy";
const { fromUtf8 } = require("@iov/encoding");

export default async (client: IClientState, contractAddress: string) => {
  let handleMsg: any = {
    trigger_close_round: {
      entropy: entropy(27),
    },
  };

  try {
    await client.execute.execute(
      contractAddress,
      handleMsg,
      undefined,
      undefined,
      {
        amount: [{ amount: "500000", denom: "uscrt" }],
        gas: "2000000",
      }
    );
  } catch (e) {
    if (!e.message.includes("520")) {
      throw e;
    }
  }

  handleMsg = {
    trigger_end_and_start_round: {},
  };

  try {
    await client.execute.execute(
      contractAddress,
      handleMsg,
      undefined,
      undefined,
      {
        amount: [{ amount: "500000", denom: "uscrt" }],
        gas: "5000000",
      }
    );
  } catch (e) {
    if (!e.message.includes("520")) {
      throw e;
    }
  }
};
