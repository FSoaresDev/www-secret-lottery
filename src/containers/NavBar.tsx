import { Dispatch, useContext, useEffect, useState } from "react"
import { ClientContext, IClientState } from "../context/ClientContext";
import { SigningCosmWasmClient } from 'secretjs';
import constants from "../constants";
import getBalance from "../api/getBalance";
import React from "react";
import { ViewKeyContext, ViewKeyDispatchContext } from "../context/ViewKeyContext";
import { BalancesContext, BalancesDispatchContext } from "../context/BalancesContext";
import formatNumber from "../utils/formatNumber";
import createViewKey from "../api/createViewKey";
import { errorNotification, successNotification } from "../utils/notifications";
import { Modal, NavDropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link } from "react-router-dom";
import convertTosSCRT from "../api/convertTosSCRT";
import triggerTestnet from "../api/triggerTestnet";
import permitDetails from "../utils/permitDetails";

export default ({
    menu
}: {
    menu: string
}) => {
    const client = useContext(ClientContext);
    const viewkey = useContext(ViewKeyContext);
    const viewkeyDispatchState = useContext(ViewKeyDispatchContext);
    const balances = useContext(BalancesContext);
    const balancesDispatch = useContext(BalancesDispatchContext);
    const [loadingConvertTestnetSSCRT, setLoadingConvertTestnetSSCRT] = useState<boolean>(false)
    //const [sSCRTBalance, setsSCRTBalance] = useState<number | null>(null)
    const [removeVKModalShow, setRemoveVKModalShow] = useState<boolean>(false)

    useEffect(() => {
        if (client) {
            viewkeyDispatchState(null);

            if (menu === "SEFI") {
                getSEFIBalance()
                if (localStorage.getItem("SEFI_" + client.accountData.address)) {
                    viewkeyDispatchState(localStorage.getItem("SEFI_" + client.accountData.address))
                }
            }
            testPermits()
        }
    }, [client, menu])

    const testPermits = async () => {
        if (!client) return
        // test permits
        let permit = await permitDetails(client.accountData.address);
        let res = await client.execute.queryContractSmart(
            constants.SECRET_LOTTERY_CONTRACT_ADDRESS,
            {
                with_permit: {
                    query: { get_user_rounds_ticket_count: { round_numbers: [0] } },
                    permit
                },
            }
        );
        console.log(res)

        res = await client.execute.queryContractSmart(
            constants.SECRET_LOTTERY_CONTRACT_ADDRESS,
            {
                with_permit: {
                    query: { get_paginated_user_rounds: { page: 0, page_size: 25 } },
                    permit
                },
            }
        );
        console.log(res)

        res = await client.execute.queryContractSmart(
            constants.SECRET_LOTTERY_CONTRACT_ADDRESS,
            {
                with_permit: {
                    query: { get_user_round_paginated_tickets: { round_number: 0, page: 0, page_size: 25 } },
                    permit
                },
            }
        );
        console.log(res)
        /*let handleMsg = { revoke_permit: { permit_name: "secret_lottery" } };
        const { transactionHash: transactionHash1 } = await client.execute.execute(
            constants.SECRET_LOTTERY_CONTRACT_ADDRESS,
            handleMsg,
            undefined,
            undefined,
            {
                amount: [{ amount: "500000", denom: "uscrt" }],
                gas: "1000000",
            }
        );
        console.log(transactionHash1)
        res = await client.execute.queryContractSmart(
            constants.SECRET_LOTTERY_CONTRACT_ADDRESS,
            {
                with_permit: {
                    query: { get_user_round_paginated_tickets: { round_number: 0, page: 0, page_size: 25 } },
                    permit
                },
            }
        );
        console.log(res)*/
    }


    const getSEFIBalance = async () => {
        if (!client) return null
        const response = await getBalance(client, constants.SEFI_CONTRACT_ADDRESS)
        const accountData = await client.execute.getAccount(client.accountData.address);
        balancesDispatch({
            native: parseInt(accountData ? accountData.balance[0].amount : "0"),
            sSCRT: null,
            SEFI: response
        })
    }

    const renderViewKey = () => {
        if (client && viewkey) {
            return (
                <div style={{ padding: "8px 13px", borderRadius: "10px", marginRight: "10px" }}
                    onClick={() => setRemoveVKModalShow(true)}
                >
                    <i style={{ color: "green" }} className="fas fa-key fa-lg"></i>
                </div>
            )
        } else {
            return (
                <div style={{ padding: "8px 13px", borderRadius: "10px", marginRight: "10px" }}>
                    <i style={{ color: "red" }} className="fas fa-key fa-lg"></i>
                </div>
            )
        }
    }

    const selectedMenuStyle = (menuName: string) => {
        if (window.location.href.split("/")[window.location.href.split("/").length - 1] === menuName) {
            return {
                borderBottom: "3px solid rgb(91, 192, 222)",
                paddingBottom: "3px",
                alignSelf: "center",
                margin: "0px"
            }
        } else {
            return {
                alignSelf: "center",
                margin: "0px"
            }
        }
    }

    return (
        <React.Fragment>
            <nav className="navbar justify-content-between " style={{ color: "white" }}>
                <a className="navbar-brand">
                    <img style={{ maxHeight: "25px", marginRight: "10px", marginLeft: "10px" }} src={require("../assets/dice.png").default} />
                </a>
                <div className="navbar-nav">
                    <h3 style={{
                        color: "white",
                        marginRight: "10px",
                    }}>
                        Secret Lottery
                    </h3>
                </div>

                <div className="navbar-nav mr-auto">

                </div>
                {
                    !client && <button className="btn btn-warning py-2 px-4" onClick={() => window.open("https://wallet.keplr.app/#/dashboard")}>Get Keplr Wallet</button>
                }
                {
                    client && balances &&
                    <React.Fragment>
                        <div style={{ display: "flex", padding: "8px 13px", borderRadius: "10px" }}>
                            {client.accountData.address.slice(0, 10) + "..." + client.accountData.address.slice(client.accountData.address.length - 5, client.accountData.address.length)}
                        </div>
                        {renderViewKey()}
                        <div style={{ border: "1px solid white", padding: "8px 13px", borderRadius: "10px" }}>
                            <div>
                                <span style={{ marginRight: "10px", verticalAlign: "middle" }}>{"" + formatNumber(balances.native / 1000000) + " SCRT"} </span>
                                <i className="fas fa-arrows-alt-h" style={{ fontSize: "1.5rem", verticalAlign: "middle" }}
                                    onClick={() => {
                                        if (menu === "sSCRT") window.open("https://wallet.keplr.app/#/secret/secret-secret", "_blank")
                                        if (menu === "SEFI") window.open("https://app.secretswap.io/", "_blank")
                                    }}></i>
                                <span style={{ marginLeft: "10px", verticalAlign: "middle" }}>
                                    {
                                        menu !== "SEFI" ? null : balances.SEFI ? formatNumber(balances.SEFI / 1000000) + " SEFI" :
                                            <span><i style={{ color: "red", marginRight: "5px" }} className="fas fa-key" onClick={async () => {
                                                try {
                                                    await window.keplr.suggestToken(constants.CHAIN_ID, constants.SEFI_CONTRACT_ADDRESS);
                                                    const sleep = (ms: number) => new Promise((accept) => setTimeout(accept, ms));
                                                    await sleep(1000);
                                                    getSEFIBalance()
                                                } catch (e: any) {
                                                    errorNotification(e)
                                                }
                                            }
                                            }></i> {menu}</span>
                                    }
                                </span>
                            </div>
                        </div>
                        <div style={{
                            border: "1px solid white",
                            padding: "4px 7px",
                            borderRadius: "10px",
                            margin: "10px",
                            fontSize: ".85rem"
                        }}>
                            <div className="row" style={{ justifyContent: "center", margin: "0px" }}><span>Testnet</span></div>
                            <div className="row" style={{ justifyContent: "center", margin: "0px" }}>
                                <div className="col" style={{ padding: "3px" }}>
                                    <button className="btn btn-warning" style={{ fontSize: ".75rem" }} onClick={() => window.open("https://faucet.secrettestnet.io/", "_blank")}> Get SCRT</button>
                                </div>
                                <div className="col" style={{ padding: "3px" }}>
                                    <button className="btn btn-warning" style={{ fontSize: ".75rem" }}
                                        disabled={loadingConvertTestnetSSCRT}
                                        onClick={async () => {
                                            try {
                                                setLoadingConvertTestnetSSCRT(true)
                                                await convertTosSCRT(client, constants.SSCRT_CONTRACT_ADDRESS)
                                                setLoadingConvertTestnetSSCRT(false)
                                            } catch (e) {
                                                setLoadingConvertTestnetSSCRT(false)
                                            }
                                        }
                                        }>
                                        {
                                            loadingConvertTestnetSSCRT ?
                                                <i className="fa fa-spinner fa-spin"></i> :
                                                "Convert to sSCRT"
                                        }
                                    </button>
                                </div>
                                {
                                    menu === "SEFI" &&
                                    <div className="col" style={{ padding: "3px" }}>
                                        <button className="btn btn-warning" style={{ fontSize: ".75rem" }}
                                            onClick={async () => {
                                                window.open("https://ethbridge.test.enigma.co/swap#Swap", "_blank")
                                            }
                                            }>
                                            {
                                                "Swap"
                                            }
                                        </button>
                                    </div>
                                }
                                <div className="col" style={{ padding: "3px" }}>
                                    <button className="btn btn-warning" style={{ fontSize: ".75rem" }}
                                        onClick={async () => {
                                            try {
                                                await triggerTestnet(client, constants.SECRET_LOTTERY_CONTRACT_ADDRESS)
                                                successNotification("Trigger")
                                                window.location.reload();
                                            } catch (e: any) {
                                                errorNotification(e)
                                            }
                                        }
                                        }>
                                        {
                                            "Trigger"
                                        }
                                    </button>
                                </div>
                            </div>

                        </div>
                    </React.Fragment>
                }
            </nav>
            {
                client &&
                <RemoveVKModal
                    menu={menu}
                    client={client}
                    viewkey={viewkey}
                    viewkeyDispatchState={viewkeyDispatchState}
                    removeVKModalShow={removeVKModalShow}
                    setRemoveVKModalShow={setRemoveVKModalShow}
                />
            }
        </React.Fragment>
    )
}

const RemoveVKModal = ({
    menu,
    client,
    viewkey,
    viewkeyDispatchState,
    removeVKModalShow,
    setRemoveVKModalShow
}: {
    menu: string,
    client: IClientState,
    viewkey: string | null,
    viewkeyDispatchState: Function,
    removeVKModalShow: boolean,
    setRemoveVKModalShow: Dispatch<boolean>
}) => {
    return (
        <Modal centered show={removeVKModalShow} onHide={() => setRemoveVKModalShow(false)} >
            <div style={{ background: "linear-gradient(180deg, #242525 0%, #000 180%)", color: "white" }}>
                <div className="modal-header">
                    <h5 className="modal-title">View Key</h5>
                    <button type="button" className="close" data-dismiss="modal" aria-label="Close" style={{ color: "white" }} onClick={() => setRemoveVKModalShow(false)}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="modal-body">
                    <div className="mb-3">
                        <label htmlFor="exampleFormControlInput1" className="form-label">View Key:</label>
                        <input style={{ textAlign: "center" }} type="text" disabled className="form-control" id="exampleFormControlInput1" placeholder="VK" value={viewkey || ""} />
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-danger py-2 px-4" data-bs-dismiss="modal" onClick={() => {
                        localStorage.removeItem(`${menu}_` + client.accountData.address)
                        viewkeyDispatchState(null);
                        setRemoveVKModalShow(false)
                    }}>Remove</button>
                    <button type="button" className="btn btn-secondary py-2 px-4" data-bs-dismiss="modal" onClick={() => setRemoveVKModalShow(false)}>Close</button>
                </div>
            </div>

        </Modal>
    )
}