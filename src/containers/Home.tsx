import { useContext, useEffect, useState } from "react"
import { Col, Container, Dropdown, Row } from "react-bootstrap"
import buyTickets from "../api/buyTickets"
import getBalance from "../api/getBalance"
import getConfigs, { Configs } from "../api/getConfigs"
import getRounds, { IRound } from "../api/getRounds"
import getUserTickets, { IUserTicket } from "../api/getUserTickets"
import constants from "../constants"
import { BalancesDispatchContext } from "../context/BalancesContext"
import { ClientContext, IClientState } from "../context/ClientContext"
import { ViewKeyContext } from "../context/ViewKeyContext"
import formatNumber from "../utils/formatNumber"
import generateRandomTickets from "../utils/generateRandomTickets"
import BootstrapSwitchButton from 'bootstrap-switch-button-react'

export default ({
    menu
}: {
    menu: string
}) => {
    const client = useContext(ClientContext);
    const viewkey = useContext(ViewKeyContext);

    const [configs, setConfigs] = useState<Configs | null>(null)
    const [currentRoundsState, setCurrentRoundsState] = useState<IRound | null>(null)
    const [currentRoundUserTickets, setCurrentRoundUserTickets] = useState<IUserTicket[] | null>(null)

    const [isManualTickets, setIsManualTickets] = useState<boolean>(false);
    const [autoTicketsCount, setAutoTicketsCount] = useState<string>("0");
    const [manualTickets, setManualTickets] = useState<string[]>([]);


    useEffect(() => {
        if (client && viewkey) {
            getConfigsTrigger(client)
        }
    }, [client, viewkey])

    useEffect(() => {
        if (client && viewkey && configs) {
            getCurrentRound(client, viewkey, configs.current_round_number);
        }
    }, [configs])

    const getConfigsTrigger = async (client: IClientState) => {
        const configs = await getConfigs(client, constants.SECRET_LOTTERY_CONTRACT_ADDRESS)
        setConfigs(configs)
    }

    const getCurrentRound = async (client: IClientState, viewkey: string, current_round: number) => {
        const currentRoundPromise = getRounds(client, constants.SECRET_LOTTERY_CONTRACT_ADDRESS, [current_round])
        const currentRoundUserTicketsPromise = getUserTickets(client, constants.SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, [current_round]);

        const [currentRound, currentRoundUserTickets] = await Promise.all([currentRoundPromise, currentRoundUserTicketsPromise]);

        console.log(currentRoundUserTickets)
        setCurrentRoundsState(currentRound.rounds[0])
        setCurrentRoundUserTickets(currentRoundUserTickets.user_tickets[0])
    }

    console.log(currentRoundsState)
    /*
    const balancesDispatch = useContext(BalancesDispatchContext);
    const currentRoundsState = useContext(CurrentRoundsStateContext);
    const currentRoundsStateDispatch = useContext(CurrentRoundsStateDispatchContext);

    //const [currentRoundsState, setCurrentRoundsState] = useState<PaginagedRounds | null>(null)
    const [pollConfigs, setPollConfigs] = useState<TierConfigs | null>(null)
    const [currentRoundsUserBets, setCurrentRoundsUserBets] = useState<UserBets | null>(null)
    const [paginatedUserBets, setPaginatedUserBets] = useState<{ user_bets: UserBet[], bet_rounds: Round[], user_bets_total_count: number } | null>(null);
    const [paginationValues, setPaginationsValues] = useState<{
        page_size: number,
        page: number
    }>({
        page_size: 5,
        page: 1
    })

    useEffect(() => {
        if (client && viewkey) {
            getTierConfigsTrigger(client)
            getCurrentRoundsStateTrigger(client, viewkey, true)
            // Trigger refresh every 30 sec
            setInterval(() => {
                if ( new Date().getSeconds() === 30 || new Date().getSeconds() === 0 ) {
                    getCurrentRoundsStateTrigger(client, viewkey, false)
                    triggerGetPaginatedUserBets(paginationValues.page - 1,paginationValues.page_size)
                }
            },1000); // check every second if we are at the 30 seconds or 0 seconds of every minute, then trigger
        }
    }, [client, viewkey])

    const getTierConfigsTrigger = async (client: IClientState) => {
        const contract = getCorrectContract(menu);
        const tierConfigs = await getTierConfigs(client, contract)
        setPollConfigs(tierConfigs)
    } 

    const getCurrentRoundsStateTrigger = async (client: IClientState, viewkey: string, triggerCurrentRoundUserBets: boolean = false) => {
        const contract = getCorrectContract(menu);
        const paginatedRounds = await getPaginatedRounds(client, contract, 0, 1)
        currentRoundsStateDispatch(paginatedRounds)
        if(triggerCurrentRoundUserBets) {
            getCurrentRoundUserBets(client, viewkey, paginatedRounds)
        }
    }

    const getCurrentRoundUserBets = async (client: IClientState, viewkey: string, paginatedRounds: PaginagedRounds) => {
        const contract  = getCorrectContract(menu);
        const getCurrentRoundUserBetsResponse = await getUserBets(client, contract, viewkey,[
            "tier1_round" + paginatedRounds.tier1_rounds[0].round_number,
            "tier2_round" + paginatedRounds.tier2_rounds[0].round_number,
            "tier3_round" + paginatedRounds.tier3_rounds[0].round_number,
        ])
        setCurrentRoundsUserBets(getCurrentRoundUserBetsResponse)
    }

    const getSEFIBalance = async () => {
        if (!client) return null
        const response = await getBalance(client, constants.SEFI_CONTRACT_ADDRESS)
        const accountData = await client.execute.getAccount(client.accountData.address);
        balancesDispatch({
            native: parseInt(accountData ? accountData.balance[0].amount : "0"),
            SEFI: response
        })
    }

    const triggerGetPaginatedUserBets = async (page: number, page_size: number) => {
        if (!client || !viewkey) return
        const contract = getCorrectContract(menu);
        const response = await getPaginatedUserBets(client, contract, viewkey, page || 0, page_size || 5)
        setPaginatedUserBets(response)
    }
*/
    if (!client) return (
        <div>
            <button className="btn btn-warning py-2 px-4" onClick={() => window.open("https://wallet.keplr.app/#/dashboard")}>Keplr Wallet</button>
        </div>
    )
    if (!viewkey) return null
    return (
        <div>
            <div style={{ color: "white", width: "100%" }}>
                <Container>
                    {
                        currentRoundsState &&
                        <Row>
                            <Col style={{ padding: "40px", borderRadius: "30px", border: "solid", marginRight: "10px" }}>
                                <span style={{ fontSize: "16px", lineHeight: "24px", display: "block", marginBottom: "8px" }}>Current Jackpot Prize</span>
                                <span style={{ fontSize: "36px", lineHeight: "46px", display: "block", marginBottom: "8px" }}>
                                    {currentRoundsState && formatNumber(parseInt(currentRoundsState.running_pot_size) / 1000000)} SEFI
                                </span>
                                <div style={{ backgroundColor: "white", height: "1px", width: "100%", marginTop: "30px", marginBottom: "30px" }}>
                                </div>
                                <span>Current Round Ticket Count: {currentRoundsState.ticket_count} </span>
                                <br />
                                <span>Round {currentRoundsState.round_number} </span>
                            </Col>
                            <Col style={{ borderRadius: "30px", border: "solid", marginLeft: "10px", marginRight: "10px" }}>
                                <Row style={{ justifyContent: "center", marginTop: "10px", marginBottom: "10px" }}>
                                    <Col style={{ textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                                        <span style={{ fontSize: "20px", lineHeight: "28px" }}>Buy Tickets</span>
                                    </Col>
                                    <Col style={{ textAlign: "left" }}>
                                        <BootstrapSwitchButton
                                            checked={isManualTickets}
                                            width={100}
                                            onlabel='Manual'
                                            onstyle="outline-light"
                                            offstyle="outline-light"
                                            style="border"
                                            offlabel='Auto'
                                            size="sm"
                                            onChange={(checked: boolean) => {
                                                setIsManualTickets(checked);
                                                setAutoTicketsCount("0");
                                                setManualTickets([]);
                                            }}
                                        />
                                    </Col>
                                </Row>
                                <Row style={{ justifyContent: "center" }}>
                                    <div style={{ backgroundColor: "white", height: "1px", width: "80%", marginBottom: "30px", }}>
                                    </div>
                                </Row>
                                <Row>
                                    {
                                        !isManualTickets &&
                                        <div style={{width: "100%"}}>
                                            <span>How many tickets to buy?</span>
                                            <br />
                                            <div style={{ display: "flex", justifyContent: "center" }}>
                                                <button onClick={() => {
                                                    if (parseInt(autoTicketsCount) > 0) setAutoTicketsCount("" + (parseInt(autoTicketsCount) - 1))
                                                }}><i className="fas fa-minus"></i></button>
                                                <input
                                                    style={{ textAlign: "center", width: "30%" }}
                                                    type="number"
                                                    value={autoTicketsCount}
                                                    onChange={(e) => {
                                                        if (!e.target.value || e.target.value === "") setAutoTicketsCount("0")
                                                        else if (parseInt(e.target.value) >= 150) setAutoTicketsCount("150")
                                                        else setAutoTicketsCount(e.target.value)
                                                    }} />
                                                <button onClick={() => {
                                                    if (parseInt(autoTicketsCount) >= 150) setAutoTicketsCount("150")
                                                    else setAutoTicketsCount("" + (parseInt(autoTicketsCount) + 1))
                                                }}><i className="fas fa-plus"></i></button>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "center" }}>
                                                <button onClick={() => {
                                                    if (parseInt(autoTicketsCount) + 5 >= 150) setAutoTicketsCount("150")
                                                    else setAutoTicketsCount("" + (parseInt(autoTicketsCount) + 5))
                                                }}>+5</button>
                                                <button onClick={() => {
                                                    if (parseInt(autoTicketsCount) + 10 >= 150) setAutoTicketsCount("150")
                                                    else setAutoTicketsCount("" + (parseInt(autoTicketsCount) + 10))
                                                }}>+10</button>
                                                <button onClick={() => {
                                                    if (parseInt(autoTicketsCount) + 25 >= 150) setAutoTicketsCount("150")
                                                    else setAutoTicketsCount("" + (parseInt(autoTicketsCount) + 25))
                                                }}>+25</button>
                                                <button onClick={() => setAutoTicketsCount("" + ("0"))}>Reset</button>
                                            </div>
                                        </div>
                                    }
                                    {
                                        isManualTickets &&
                                        <div style={{width: "100%"}}>
                                            <span>Buy manual tickets</span>
                                            {
                                                manualTickets.map((manualTicket, manualTicketIndex) =>
                                                    <div style={{ display: "flex", justifyContent: "center" }}>
                                                        {Array(6).fill(null).map((_, index) =>
                                                            <Dropdown style={{ margin: "5px" }}>
                                                                <Dropdown.Toggle variant="info" id="dropdown-basic" style={{ borderRadius: "80%" }}>
                                                                    {manualTicket[index]}
                                                                </Dropdown.Toggle>
                                                                <Dropdown.Menu>
                                                                    {
                                                                        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => <Dropdown.Item onClick={() => {
                                                                            let updatedManualTickets = [...manualTickets];
                                                                            updatedManualTickets[manualTicketIndex] = manualTicket.substring(0, index) + digit + manualTicket.substring(index + 1);
                                                                            setManualTickets(updatedManualTickets)
                                                                        }}>{digit}</Dropdown.Item>)
                                                                    }
                                                                </Dropdown.Menu>
                                                            </Dropdown>)
                                                        }
                                                        <button type="button" className="btn btn-danger" onClick={() => {
                                                            let updatedManualTickets = [...manualTickets];
                                                            updatedManualTickets.splice(manualTicketIndex, 1)
                                                            setManualTickets(updatedManualTickets)
                                                        }}><i className="fas fa-trash" ></i></button>
                                                    </div>
                                                )
                                            }
                                            <br />
                                            <button className="btn btn-success" onClick={() => setManualTickets([...manualTickets, "000000"])}><i className="fas fa-plus-circle"></i></button>
                                        </div>
                                    }
                                </Row>
                                <Row style={{ justifyContent: "center" }}>
                                    <button type="button" className="btn btn-success" style={{ borderRadius: "10px", margin: "5px" }}
                                        onClick={() => {
                                            let tickets = null;
                                            let ticketPrice = null;
                                            if (isManualTickets) {
                                                tickets = manualTickets;
                                                ticketPrice = "" + parseInt(currentRoundsState.round_ticket_price) * (manualTickets.length)
                                            } else {
                                                const autoGeneratedTickets = generateRandomTickets(parseInt(autoTicketsCount));
                                                tickets = autoGeneratedTickets;
                                                ticketPrice = "" + parseInt(currentRoundsState.round_ticket_price) * (parseInt(autoTicketsCount))
                                            }
                                            buyTickets(
                                                client,
                                                constants.SEFI_CONTRACT_ADDRESS,
                                                constants.SECRET_LOTTERY_CONTRACT_ADDRESS,
                                                tickets,
                                                ticketPrice
                                            )
                                        }}>
                                        Buy
                                        <br />
                                        {
                                            isManualTickets ? 
                                            formatNumber((parseInt(currentRoundsState.round_ticket_price) * (manualTickets.length)) / 1000000) : 
                                            formatNumber((parseInt(currentRoundsState.round_ticket_price) * (parseInt(autoTicketsCount))) / 1000000)
                                        } SEFI
                                    </button>
                                </Row>
                                <Row style={{ justifyContent: "center" }}>
                                    You already have {currentRoundUserTickets && currentRoundUserTickets.length} tickets this round!
                                </Row>
                            </Col>
                            <Col style={{ borderRadius: "30px", border: "solid", marginLeft: "10px" }}>
                                <span>Reward Pot Distribution</span>
                            </Col>
                        </Row>
                    }
                    <Row>
                        <div style={{ backgroundColor: "white", height: "1px", width: "100%", marginTop: "30px", marginBottom: "30px", }}>
                        </div>
                    </Row>
                    {
                        // User Tickets
                    }
                    <Row>
                        <Col xs={8}>
                            <div className="row" style={{ justifyContent: "center", margin: "0px" }}>
                                <h2>My Tickets</h2>
                            </div>
                            <table className="table table-striped table-dark" style={{ margin: "20px" }}>
                                <thead>
                                    <tr>
                                        <th scope="col">Round</th>
                                        <th scope="col">End Date</th>
                                        <th scope="col">Tickets</th>
                                        <th scope="col">Total Reward</th>
                                        <th scope="col">Actions</th>
                                    </tr>
                                </thead>
                            </table>
                        </Col>
                    </Row>

                </Container>

            </div>
        </div>
    )
}