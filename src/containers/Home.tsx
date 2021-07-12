import React, { useContext, useEffect, useState } from "react"
import { Col, Container, Dropdown, Form, Row } from "react-bootstrap"
import buyTickets from "../api/buyTickets"
import getBalance from "../api/getBalance"
import getConfigs, { IConfigs } from "../api/getConfigs"
import getRounds, { IRound } from "../api/getRounds"
import getUserTickets, { IUserTicket } from "../api/getUserTickets"
import constants from "../constants"
import { BalancesDispatchContext } from "../context/BalancesContext"
import { ClientContext, IClientState } from "../context/ClientContext"
import { ViewKeyContext } from "../context/ViewKeyContext"
import formatNumber from "../utils/formatNumber"
import generateRandomTickets from "../utils/generateRandomTickets"
import BootstrapSwitchButton from 'bootstrap-switch-button-react'
import getPaginatedUserTickets, { IPaginatedUserTickets } from "../api/getPaginatedUserTickets"
import getPrizedTicketResults, { IPrizedTicketResults } from "../utils/getPrizedTicketResults"
import claimRewards from "../api/claimRewards"
import getTicketsIndexToClaim from "../utils/getTicketsIndexToClaim"
import { errorNotification, successNotification } from "../utils/notifications"
import Countdown from "./Countdown"
import calcBulkDiscountTicketPrice from "../utils/calcBulkDiscountTicketPrice"
import getRoundStakingRewards, { IStakingRewads } from "../api/getRoundStakingRewards"
import calcTotalPotSize from "../utils/calcTotalPotSize"

export default ({
    menu
}: {
    menu: string
}) => {
    const client = useContext(ClientContext);
    const viewkey = useContext(ViewKeyContext);
    const balancesDispatch = useContext(BalancesDispatchContext);

    const [configs, setConfigs] = useState<IConfigs | null>(null)
    const [currentRoundsState, setCurrentRoundsState] = useState<IRound | null>(null)
    const [currentRoundUserTickets, setCurrentRoundUserTickets] = useState<IUserTicket[] | null>(null)
    const [stakingRewards, setStakingRewards] = useState<IStakingRewads | null>(null)

    const [isManualTickets, setIsManualTickets] = useState<boolean>(false);
    const [autoTicketsCount, setAutoTicketsCount] = useState<string>("0");
    const [manualTickets, setManualTickets] = useState<string[]>([]);
    const [paginatedUserTickets, setPaginatedUserTickets] = useState<IPaginatedUserTickets | null>(null);
    const [expandRow, setExpandRow] = useState<number | null>(null);
    const [paginationValues, setPaginationsValues] = useState<{
        page_size: number,
        page: number
    }>({
        page_size: 5,
        page: 1
    })

    const [loadingBuyTickets, setLoadingBuyTickets] = useState<boolean>(false)
    const [loadingClaimReward, setLoadingClaimReward] = useState<{ ticket: string | null, loading: boolean }>({
        ticket: null,
        loading: false
    })

    const [searchState, setSearchState] = useState<string>("");
    const [roundViewer, setRoundViewer] = useState<IRound | null>(null);
    useEffect(() => {
        if (client && viewkey) {
            getConfigsTrigger(client)
            getPaginatedUserTicketsTrigger(client, viewkey, paginationValues.page, paginationValues.page_size)
            setInterval(() => {
                getConfigsTrigger(client)
                getPaginatedUserTicketsTrigger(client, viewkey, paginationValues.page, paginationValues.page_size)
                
            }, 30000); // check 30 seconds
        }
    }, [client, viewkey])

    useEffect(() => {
        if (client && viewkey && configs) {
            getCurrentRoundTrigger(client, viewkey, configs.current_round_number);
            getRoundStakingRewardsTrigger(client, configs)
        }
    }, [configs])

    const getConfigsTrigger = async (client: IClientState) => {
        const configs = await getConfigs(client, constants.SECRET_LOTTERY_CONTRACT_ADDRESS)
        setConfigs(configs)
    }

    const getCurrentRoundTrigger = async (client: IClientState, viewkey: string, current_round: number) => {
        const currentRoundPromise = getRounds(client, constants.SECRET_LOTTERY_CONTRACT_ADDRESS, [current_round])
        const currentRoundUserTicketsPromise = getUserTickets(client, constants.SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, [current_round]);

        const [currentRound, currentRoundUserTickets] = await Promise.all([currentRoundPromise, currentRoundUserTicketsPromise]);

        setCurrentRoundsState(currentRound.rounds[0])
        setCurrentRoundUserTickets(currentRoundUserTickets.user_tickets[0])
    }

    const getPaginatedUserTicketsTrigger = async (client: IClientState, viewkey: string, page: number, page_size: number) => {
        const paginatedUserTickets = await getPaginatedUserTickets(client, constants.SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, page - 1, page_size)
        setPaginatedUserTickets(paginatedUserTickets);
    }

    const getRoundStakingRewardsTrigger = async (client: IClientState, configs: IConfigs) => {
        const roundStakingRewards = await getRoundStakingRewards(client, configs.staking_contract.address, configs.staking_vk)
        setStakingRewards(roundStakingRewards);
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

    const calcTotalRewards = (draftedTicket: string, tickets: IUserTicket[], round: IRound) => {
        if (!round.reward_distribution) return 0

        const prizedTickets = getPrizedTicketResults(draftedTicket, tickets);
        let totalExpectedToClaimRewards = 0;

        if (prizedTickets.sequence_1.length > 0) {
            totalExpectedToClaimRewards = totalExpectedToClaimRewards + prizedTickets.sequence_1.length * parseInt(round.reward_distribution.sequence_1_reward_per_ticket!);
        }
        if (prizedTickets.sequence_2.length > 0) {
            totalExpectedToClaimRewards = totalExpectedToClaimRewards + prizedTickets.sequence_2.length * parseInt(round.reward_distribution.sequence_2_reward_per_ticket!);
        }
        if (prizedTickets.sequence_3.length > 0) {
            totalExpectedToClaimRewards = totalExpectedToClaimRewards + prizedTickets.sequence_3.length * parseInt(round.reward_distribution.sequence_3_reward_per_ticket!);
        }
        if (prizedTickets.sequence_4.length > 0) {
            totalExpectedToClaimRewards = totalExpectedToClaimRewards + prizedTickets.sequence_4.length * parseInt(round.reward_distribution.sequence_4_reward_per_ticket!);
        }
        if (prizedTickets.sequence_5.length > 0) {
            totalExpectedToClaimRewards = totalExpectedToClaimRewards + prizedTickets.sequence_5.length * parseInt(round.reward_distribution.sequence_5_reward_per_ticket!);
        }
        if (prizedTickets.sequence_6.length > 0) {
            totalExpectedToClaimRewards = totalExpectedToClaimRewards + prizedTickets.sequence_6.length * parseInt(round.reward_distribution.sequence_6_reward_per_ticket!);
        }

        return totalExpectedToClaimRewards
    }

    const remainingToClaimTickets = (draftedTicket: string, tickets: IUserTicket[], round: IRound) => {
        if (!round.reward_distribution) return {
            tickets: [],
            remainingPrizeToClaim: 0
        }

        let remainingToClaimTickets: IUserTicket[] = [];

        const prizedTickets = getPrizedTicketResults(draftedTicket, tickets);

        for (let ticket of tickets) {
            if (
                prizedTickets.sequence_1.find((prizedTicket) => prizedTicket.ticket === ticket.ticket && !ticket.claimed_reward) ||
                prizedTickets.sequence_2.find((prizedTicket) => prizedTicket.ticket === ticket.ticket && !ticket.claimed_reward) ||
                prizedTickets.sequence_3.find((prizedTicket) => prizedTicket.ticket === ticket.ticket && !ticket.claimed_reward) ||
                prizedTickets.sequence_4.find((prizedTicket) => prizedTicket.ticket === ticket.ticket && !ticket.claimed_reward) ||
                prizedTickets.sequence_5.find((prizedTicket) => prizedTicket.ticket === ticket.ticket && !ticket.claimed_reward) ||
                prizedTickets.sequence_6.find((prizedTicket) => prizedTicket.ticket === ticket.ticket && !ticket.claimed_reward)
            ) {
                remainingToClaimTickets.push(ticket)
            }
        }

        return {
            tickets: remainingToClaimTickets,
            remainingPrizeToClaim: calcTotalRewards(draftedTicket, remainingToClaimTickets, round)
        }
    }

    const claimButtonLogic = async (round: IRound, userRoundTickets: IUserTicket[], ticketToClaim: IUserTicket | null = null) => {
        if (!client || !viewkey || !paginatedUserTickets) return
        setLoadingClaimReward({
            ticket: ticketToClaim && ticketToClaim.ticket ? ticketToClaim.ticket : null,
            loading: true
        })
        try {
            let ticketIndexes: number[] = [];

            if (!ticketToClaim) {
                ticketIndexes = getTicketsIndexToClaim(
                    userRoundTickets, remainingToClaimTickets(round.drafted_ticket!, userRoundTickets, round).tickets
                )
            } else {
                const index = userRoundTickets.findIndex((userRoundTicket) => userRoundTicket.ticket === ticketToClaim.ticket && !userRoundTicket.claimed_reward)
                if (index != -1) ticketIndexes.push(index);
            }


            await claimRewards(
                client,
                constants.SECRET_LOTTERY_CONTRACT_ADDRESS,
                round.round_number,
                ticketIndexes
            );

            await getPaginatedUserTicketsTrigger(client, viewkey, paginationValues.page, paginationValues.page_size)
            await getSEFIBalance()

            setLoadingClaimReward({
                ticket: null,
                loading: false
            })
        }
        catch (e) {
            setLoadingBuyTickets(false)
            errorNotification(e)
            setLoadingClaimReward({
                ticket: null,
                loading: false
            })
        }

    }

    const getPrizeValueFromTicket = (round: IRound, ticketResults: IPrizedTicketResults) => {
        if (!round.drafted_ticket || !round.reward_distribution) return 0
        let accumutatedTicketRewards = 0;

        if (ticketResults.sequence_1.length > 0) {
            accumutatedTicketRewards = accumutatedTicketRewards + parseInt(round.reward_distribution.sequence_1_reward_per_ticket);
        }

        if (ticketResults.sequence_2.length > 0) {
            accumutatedTicketRewards = accumutatedTicketRewards + parseInt(round.reward_distribution.sequence_2_reward_per_ticket);
        }

        if (ticketResults.sequence_3.length > 0) {
            accumutatedTicketRewards = accumutatedTicketRewards + parseInt(round.reward_distribution.sequence_3_reward_per_ticket);
        }

        if (ticketResults.sequence_4.length > 0) {
            accumutatedTicketRewards = accumutatedTicketRewards + parseInt(round.reward_distribution.sequence_4_reward_per_ticket);
        }

        if (ticketResults.sequence_5.length > 0) {
            accumutatedTicketRewards = accumutatedTicketRewards + parseInt(round.reward_distribution.sequence_5_reward_per_ticket);
        }

        if (ticketResults.sequence_6.length > 0) {
            accumutatedTicketRewards = accumutatedTicketRewards + parseInt(round.reward_distribution.sequence_6_reward_per_ticket);
        }

        return accumutatedTicketRewards
    }

    const expandedRowRewardsColumn = (round: IRound, ticket: IUserTicket, userTickets: IUserTicket[]) => {
        if (!round.drafted_ticket || !round.reward_distribution) return " - "
        let ticketResults = getPrizedTicketResults(round.drafted_ticket, [ticket]);

        let accumutatedTicketRewards = getPrizeValueFromTicket(round, ticketResults);

        if (accumutatedTicketRewards === 0) return "No Reward"
        else {
            if (ticket.claimed_reward) {
                return (<div>Claimed<br />{formatNumber(accumutatedTicketRewards / 1000000) + " "} SEFI</div>)
            } else {
                return (
                    <button className="btn btn-success"
                        disabled={loadingClaimReward.loading && loadingClaimReward.ticket === ticket.ticket}
                        onClick={() => claimButtonLogic(round, userTickets, ticket)}>
                        {
                            loadingClaimReward.loading && loadingClaimReward.ticket === ticket.ticket ?
                                <i className="fa fa-spinner fa-spin"></i> :
                                `Claim ${formatNumber(accumutatedTicketRewards / 1000000)} SEFI`
                        }
                    </button>
                )
            }
        }
    }

    const handlePageChange = async (page: number) => {
        if (!client || !viewkey) return
        getPaginatedUserTicketsTrigger(client, viewkey, page, paginationValues.page_size)
        setPaginationsValues({
            page,
            page_size: 5
        })
    }

    const renderExpandedRow = (userRoundTickets: IUserTicket[], index: number) => {
        if (!paginatedUserTickets) return null

        const userRoundTicketsCopy: IUserTicket[] = JSON.parse(JSON.stringify(userRoundTickets));

        if (paginatedUserTickets.rounds[index].drafted_ticket) {
            userRoundTicketsCopy.sort((a, b) => {
                return (
                    getPrizeValueFromTicket(paginatedUserTickets.rounds[index], getPrizedTicketResults(paginatedUserTickets.rounds[index].drafted_ticket!, [b]))
                    -
                    getPrizeValueFromTicket(paginatedUserTickets.rounds[index], getPrizedTicketResults(paginatedUserTickets.rounds[index].drafted_ticket!, [a]))
                )
            })
        }

        return (
            userRoundTicketsCopy.map((userRoundTicket) => {

                let prizeResults: IPrizedTicketResults | null = null;
                if (paginatedUserTickets.rounds[index].drafted_ticket) {
                    prizeResults = getPrizedTicketResults(paginatedUserTickets.rounds[index].drafted_ticket!, [userRoundTicket]);
                }

                return (
                    <tr>
                        <td style={{ display: "table-cell", verticalAlign: "middle" }} ></td>
                        <td style={{ display: "table-cell", verticalAlign: "middle" }}>{userRoundTicket.round_number}</td>
                        <td style={{ display: "table-cell", verticalAlign: "middle" }}>-</td>
                        <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                            {
                                paginatedUserTickets.rounds[index].drafted_ticket ?
                                    <div>
                                        <span style={{
                                            marginRight: "5px",
                                            color: prizeResults && prizeResults.sequence_1.length > 0 ? "green" : "white",
                                            textDecoration: prizeResults && prizeResults.sequence_1.length > 0 ? "underline" : "none"
                                        }}
                                        >
                                            {paginatedUserTickets.rounds[index].drafted_ticket![0]}
                                        </span>
                                        <span style={{
                                            marginRight: "5px",
                                            color: prizeResults && prizeResults.sequence_2.length > 0 ? "green" : "white",
                                            textDecoration: prizeResults && prizeResults.sequence_2.length > 0 ? "underline" : "none"
                                        }}
                                        >
                                            {paginatedUserTickets.rounds[index].drafted_ticket![1]}
                                        </span>
                                        <span style={{
                                            marginRight: "5px",
                                            color: prizeResults && prizeResults.sequence_3.length > 0 ? "green" : "white",
                                            textDecoration: prizeResults && prizeResults.sequence_3.length > 0 ? "underline" : "none"
                                        }}
                                        >
                                            {paginatedUserTickets.rounds[index].drafted_ticket![2]}
                                        </span>
                                        <span style={{
                                            marginRight: "5px",
                                            color: prizeResults && prizeResults.sequence_4.length > 0 ? "green" : "white",
                                            textDecoration: prizeResults && prizeResults.sequence_4.length > 0 ? "underline" : "none"
                                        }}
                                        >
                                            {paginatedUserTickets.rounds[index].drafted_ticket![3]}
                                        </span>
                                        <span style={{
                                            marginRight: "5px",
                                            color: prizeResults && prizeResults.sequence_5.length > 0 ? "green" : "white",
                                            textDecoration: prizeResults && prizeResults.sequence_5.length > 0 ? "underline" : "none"
                                        }}
                                        >
                                            {paginatedUserTickets.rounds[index].drafted_ticket![4]}
                                        </span>
                                        <span style={{
                                            marginRight: "5px",
                                            color: prizeResults && prizeResults.sequence_6.length > 0 ? "green" : "white",
                                            textDecoration: prizeResults && prizeResults.sequence_6.length > 0 ? "underline" : "none"
                                        }}
                                        >
                                            {paginatedUserTickets.rounds[index].drafted_ticket![5]}
                                        </span>
                                    </div> :
                                    " - "
                            }
                        </td>
                        <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <span style={{
                                marginRight: "5px",
                                color: prizeResults && prizeResults.sequence_1.length > 0 ? "green" : "white",
                                textDecoration: prizeResults && prizeResults.sequence_1.length > 0 ? "underline" : "none"
                            }}
                            >
                                {userRoundTicket.ticket[0]}
                            </span>
                            <span style={{
                                marginRight: "5px",
                                color: prizeResults && prizeResults.sequence_2.length > 0 ? "green" : "white",
                                textDecoration: prizeResults && prizeResults.sequence_2.length > 0 ? "underline" : "none"
                            }}
                            >
                                {userRoundTicket.ticket[1]}
                            </span>
                            <span style={{
                                marginRight: "5px",
                                color: prizeResults && prizeResults.sequence_3.length > 0 ? "green" : "white",
                                textDecoration: prizeResults && prizeResults.sequence_3.length > 0 ? "underline" : "none"
                            }}
                            >
                                {userRoundTicket.ticket[2]}
                            </span>
                            <span style={{
                                marginRight: "5px",
                                color: prizeResults && prizeResults.sequence_4.length > 0 ? "green" : "white",
                                textDecoration: prizeResults && prizeResults.sequence_4.length > 0 ? "underline" : "none"
                            }}
                            >
                                {userRoundTicket.ticket[3]}
                            </span>
                            <span style={{
                                marginRight: "5px",
                                color: prizeResults && prizeResults.sequence_5.length > 0 ? "green" : "white",
                                textDecoration: prizeResults && prizeResults.sequence_5.length > 0 ? "underline" : "none"
                            }}
                            >
                                {userRoundTicket.ticket[4]}
                            </span>
                            <span style={{
                                marginRight: "5px",
                                color: prizeResults && prizeResults.sequence_6.length > 0 ? "green" : "white",
                                textDecoration: prizeResults && prizeResults.sequence_6.length > 0 ? "underline" : "none"
                            }}
                            >
                                {userRoundTicket.ticket[5]}
                            </span>
                        </td>
                        <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                            {
                                expandedRowRewardsColumn(paginatedUserTickets.rounds[index], userRoundTicket, userRoundTickets)
                            }
                        </td>
                    </tr>
                )
            }
            )
        )
    }

    if (!client) return (
        <div>
            <i className="fa fa-spinner fa-spin" style={{ color: "white" }}></i>
        </div>
    )
    if (!viewkey) return null
    return (
        <div>
            <div style={{ color: "white", width: "100%" }}>
                {
                    (!currentRoundsState || !configs) && <i className="fa fa-spinner fa-spin" style={{ color: "white" }}></i>
                }
                {
                    currentRoundsState && configs && stakingRewards &&
                    <Container fluid style={{ width: "80%" }}>
                        {
                            <Row>
                                <Col style={{ padding: "30px", borderRadius: "30px", border: "solid", marginRight: "10px" }}>
                                    <Row style={{ justifyContent: "center" }}>
                                        <span style={{ fontSize: "1.5rem", display: "block", marginBottom: "8px" }}>Prize Pot</span>
                                    </Row>
                                    <Row style={{ justifyContent: "center" }}> 
                                        <span style={{ fontSize: "3rem", display: "block", marginBottom: "8px" }}>
                                            {currentRoundsState && formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) / 1000000)} SEFI
                                        </span>
                                    </Row>
                                    <div style={{ backgroundColor: "white", height: "1px", width: "100%", marginTop: "15px", marginBottom: "15px" }}>
                                    </div>
                                    <Row>
                                        <Col style={{ justifyContent: "center" }}>
                                            <span style={{ fontSize: "1.5rem" }}>Round {currentRoundsState.round_number} </span>
                                        </Col>
                                        <Col style={{ justifyContent: "center" }}>
                                            <span style={{ fontSize: "1.5rem" }}> {currentRoundsState.ticket_count} Tickets</span>
                                        </Col>
                                    </Row>

                                    <Row style={{ justifyContent: "center", fontSize: "1.25rem", marginTop: "10px" }}>
                                        <Countdown currentRoundsState={currentRoundsState}/>
                                    </Row>
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
                                        <div style={{ backgroundColor: "white", height: "1px", width: "80%", marginBottom: "20px", }}>
                                        </div>
                                    </Row>
                                    <Row>
                                        {
                                            !isManualTickets &&
                                            <div style={{ width: "100%" }}>
                                                <span>How many tickets to buy?</span>
                                                <br />
                                                <div style={{ display: "flex", justifyContent: "center", margin: "10px" }}>
                                                    <button className="btn btn-dark" style={{ borderRadius: "0px", borderColor: "white" }} onClick={() => {
                                                        if (parseInt(autoTicketsCount) > 0) setAutoTicketsCount("" + (parseInt(autoTicketsCount) - 1))
                                                    }}><i className="fas fa-minus"></i></button>
                                                    <input
                                                        style={{ textAlign: "center", width: "30%", backgroundColor: "transparent", color: "white" }}
                                                        type="number"
                                                        value={autoTicketsCount}
                                                        onChange={(e) => {
                                                            if (!e.target.value || e.target.value === "") setAutoTicketsCount("0")
                                                            else if (parseInt(e.target.value) >= 400) setAutoTicketsCount("400")
                                                            else setAutoTicketsCount(e.target.value)
                                                        }} />
                                                    <button className="btn btn-dark" style={{ borderRadius: "0px", borderColor: "white" }} onClick={() => {
                                                        if (parseInt(autoTicketsCount) >= 400) setAutoTicketsCount("400")
                                                        else setAutoTicketsCount("" + (parseInt(autoTicketsCount) + 1))
                                                    }}><i className="fas fa-plus"></i></button>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "center" }}>
                                                    <button className="btn btn-dark" style={{ margin: "5px", borderColor: "white" }} onClick={() => {
                                                        if (parseInt(autoTicketsCount) + 5 >= 400) setAutoTicketsCount("400")
                                                        else setAutoTicketsCount("" + (parseInt(autoTicketsCount) + 5))
                                                    }}>+5</button>
                                                    <button className="btn btn-dark" style={{ margin: "5px", borderColor: "white" }} onClick={() => {
                                                        if (parseInt(autoTicketsCount) + 10 >= 400) setAutoTicketsCount("400")
                                                        else setAutoTicketsCount("" + (parseInt(autoTicketsCount) + 10))
                                                    }}>+10</button>
                                                    <button className="btn btn-dark" style={{ margin: "5px", borderColor: "white" }} onClick={() => {
                                                        if (parseInt(autoTicketsCount) + 25 >= 400) setAutoTicketsCount("400")
                                                        else setAutoTicketsCount("" + (parseInt(autoTicketsCount) + 25))
                                                    }}>+25</button>
                                                    <button className="btn btn-dark" style={{ margin: "5px", borderColor: "white" }} onClick={() => setAutoTicketsCount("" + ("0"))}>Reset</button>
                                                </div>
                                            </div>
                                        }
                                        {/*
                                        isManualTickets &&
                                        <div style={{ width: "100%" }}>
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
                                    */}
                                    </Row>
                                    <Row style={{ justifyContent: "center" }}>
                                        <Col xs={5}>
                                            {
                                                `${formatNumber(parseInt(currentRoundsState.round_ticket_price) / 1000000)} SEFI / ticket`
                                            }
                                            <br/>
                                            {
                                                "Discount: " + calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount,isManualTickets ? manualTickets.length : parseInt(autoTicketsCount), currentRoundsState.round_ticket_price).discount + "%"
                                            }
                                            <br/>
                                        </Col>
                                        <Col>
                                            <button type="button" className="btn btn-success" style={{ borderRadius: "10px", margin: "10px" }}
                                                disabled={
                                                    loadingBuyTickets ||
                                                    (isManualTickets && manualTickets.length === 0) ||
                                                    (!isManualTickets && parseInt(autoTicketsCount) === 0)
                                                }
                                                onClick={async () => {
                                                    if (!configs) return

                                                    setLoadingBuyTickets(true)

                                                    try {
                                                        let tickets = null;
                                                        let ticketPrice = null;
                                                        if (isManualTickets) {
                                                            tickets = manualTickets;
                                                            ticketPrice = "" + calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount,manualTickets.length, currentRoundsState.round_ticket_price).finalPrice
                                                        } else {
                                                            const autoGeneratedTickets = generateRandomTickets(parseInt(autoTicketsCount));
                                                            tickets = autoGeneratedTickets;
                                                            ticketPrice = "" + calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount,parseInt(autoTicketsCount), currentRoundsState.round_ticket_price).finalPrice
                                                        }


                                                        await buyTickets(
                                                            client,
                                                            constants.SEFI_CONTRACT_ADDRESS,
                                                            constants.SECRET_LOTTERY_CONTRACT_ADDRESS,
                                                            tickets,
                                                            ticketPrice
                                                        )
                                                        await getCurrentRoundTrigger(client, viewkey, configs.current_round_number);
                                                        await getPaginatedUserTicketsTrigger(client, viewkey, paginationValues.page, paginationValues.page_size)
                                                        await getRoundStakingRewardsTrigger(client, configs)
                                                        await getSEFIBalance()
                                                        successNotification("Buy Tickets Success!")

                                                        setLoadingBuyTickets(false)
                                                    }
                                                    catch (e) {
                                                        setLoadingBuyTickets(false)
                                                        errorNotification(e)
                                                    }
                                                }}>
                                                {
                                                    loadingBuyTickets ? <i className="fa fa-spinner fa-spin"></i> :
                                                        <div>
                                                            Buy
                                                            <br />
                                                            {
                                                                isManualTickets ?
                                                                    formatNumber(calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount, manualTickets.length, currentRoundsState.round_ticket_price).finalPrice / 1000000) :
                                                                    formatNumber(calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount, parseInt(autoTicketsCount), currentRoundsState.round_ticket_price).finalPrice / 1000000)
                                                            } SEFI
                                                        </div>
                                                }

                                            </button>
                                        </Col>
                                    </Row>
                                    {
                                        currentRoundUserTickets && currentRoundUserTickets.length > 0 &&
                                        <Row style={{ justifyContent: "center" }}>
                                            <span>{"You already have "} <b> {(currentRoundUserTickets.length + " tickets")} </b> {" this round!"} </span>

                                        </Row>
                                    }
                                </Col>
                                <Col style={{ borderRadius: "30px", border: "solid", marginLeft: "10px" }}>
                                    <Row style={{ justifyContent: "center", marginTop: "10px", marginBottom: "10px" }}>
                                        <Col style={{ textAlign: "right", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <span style={{ fontSize: "20px", lineHeight: "28px" }}>Round Pot Distribution</span>
                                        </Col>
                                    </Row>
                                    <Row style={{ justifyContent: "center" }}>
                                        <div style={{ backgroundColor: "white", height: "1px", width: "80%", marginBottom: "20px", }}>
                                        </div>
                                    </Row>
                                    {
                                        configs &&
                                        <React.Fragment>
                                            <Row>
                                                <Col xs={7}>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                </Col>
                                                <Col style={{ textAlign: "left" }}>
                                                    {`${formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_6 * 0.01) / 1000000)} SEFI`}
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col xs={7}>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                                </Col>
                                                <Col style={{ textAlign: "left" }}>
                                                    {`${formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_5 * 0.01) / 1000000)} SEFI`}
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col xs={7}>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                                    <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                </Col>
                                                <Col style={{ textAlign: "left" }}>
                                                    {`${formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_4 * 0.01) / 1000000)} SEFI`}
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col xs={7}>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                                    <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                    <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                </Col>
                                                <Col style={{ textAlign: "left" }}>
                                                    {`${formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_3 * 0.01) / 1000000)} SEFI`}
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col xs={7}>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                                    <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                    <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                    <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                </Col>
                                                <Col style={{ textAlign: "left" }}>
                                                    {`${formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_2 * 0.01) / 1000000)} SEFI`}
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col xs={7}>
                                                    <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                    <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                                    <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                    <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                    <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                    <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                </Col>
                                                <Col style={{ textAlign: "left" }}>
                                                    {`${formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_1 * 0.01) / 1000000)} SEFI`}
                                                </Col>
                                            </Row>
                                            <br />
                                            <Row>
                                                <Col xs={7}>
                                                    <i className="fas fa-fire" style={{ margin: "2px", color: "#d9534f", marginLeft: "5px", marginRight: "10px" }}></i>Burn
                                                </Col>
                                                <Col style={{ textAlign: "left" }}>
                                                    {`${formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.burn * 0.01) / 1000000)} SEFI`}
                                                </Col>
                                            </Row>
                                            <Row style={{ marginBottom: "10px" }}>
                                                <Col xs={7}>
                                                    <i className="fas fa-coins" style={{ margin: "2px", color: "#f0ad4e", marginLeft: "5px", marginRight: "10px" }}></i>Triggerer Fee
                                                </Col>
                                                <Col style={{ textAlign: "left" }}>
                                                    {`${formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.triggerer * 0.01) / 1000000)} SEFI`}
                                                </Col>
                                            </Row>
                                        </React.Fragment>
                                    }
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
                            <Col xs={7}>
                                <div className="row" style={{ justifyContent: "center", margin: "0px" }}>
                                    <h2>My Tickets</h2>
                                </div>
                                <table className="table table-striped table-dark" style={{ margin: "20px" }}>
                                    <thead>
                                        <tr>
                                            <th scope="col"></th>
                                            <th scope="col">Round</th>
                                            <th scope="col">End Date</th>
                                            <th scope="col">Drafted Ticket</th>
                                            <th scope="col">My Tickets</th>
                                            <th scope="col">Rewards</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            paginatedUserTickets &&
                                            paginatedUserTickets.user_tickets.map((userRoundTickets, index) =>
                                                <React.Fragment>
                                                    <tr key={index}>
                                                        <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                                            {
                                                                paginatedUserTickets.rounds[index].drafted_ticket &&
                                                                <button type="button" className="btn btn-secondary"
                                                                    onClick={() => {
                                                                        setSearchState("")
                                                                        setRoundViewer(paginatedUserTickets.rounds[index])
                                                                    }}
                                                                > <i className="fas fa-eye"></i></button>
                                                            }
                                                        </td>
                                                        <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                                            {paginatedUserTickets.rounds[index].round_number}
                                                        </td>
                                                        <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                                            {paginatedUserTickets.rounds[index].round_end_block ? paginatedUserTickets.rounds[index].round_end_block : " - "
                                                                /*<div>
                                                                    {new Date(paginatedUserTickets.rounds[index].round_end_timestamp! * 1000).toISOString().split("T")[0]}
                                                                    <br />
                                                                    {new Date(paginatedUserTickets.rounds[index].round_end_timestamp! * 1000).toISOString().split("T")[1].split(".")[0]}
                                                                </div> :
                                                        " - "*/}
                                                        </td>
                                                        <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                                            {paginatedUserTickets.rounds[index].drafted_ticket ? paginatedUserTickets.rounds[index].drafted_ticket!.split('').join(' ') : " - "}
                                                        </td>
                                                        <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                                            <button className={`btn btn-${expandRow === index ? "primary" : "info"}`} onClick={() => setExpandRow(expandRow === index ? null : index)}>
                                                                {userRoundTickets.length + " Tickets"}
                                                                {
                                                                    expandRow === index ?
                                                                        <i className="fas fa-chevron-up" style={{ marginLeft: "10px" }}></i> :
                                                                        <i className="fas fa-chevron-down" style={{ marginLeft: "10px" }}></i>
                                                                }
                                                            </button>
                                                        </td>
                                                        <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                                            {
                                                                paginatedUserTickets.rounds[index].drafted_ticket &&
                                                                    remainingToClaimTickets(paginatedUserTickets.rounds[index].drafted_ticket!, userRoundTickets, paginatedUserTickets.rounds[index]).remainingPrizeToClaim > 0 ?
                                                                    <button className="btn btn-success"
                                                                        disabled={loadingClaimReward.loading && loadingClaimReward.ticket === null}
                                                                        onClick={async () => {
                                                                            claimButtonLogic(paginatedUserTickets.rounds[index], userRoundTickets, null);
                                                                        }}>
                                                                        {
                                                                            loadingClaimReward.loading && loadingClaimReward.ticket === null ?
                                                                                <i className="fa fa-spinner fa-spin"></i> :
                                                                                `Claim ${formatNumber(remainingToClaimTickets(paginatedUserTickets.rounds[index].drafted_ticket!, userRoundTickets, paginatedUserTickets.rounds[index]).remainingPrizeToClaim / 1000000)} SEFI`
                                                                        }
                                                                    </button> :
                                                                    calcTotalRewards(paginatedUserTickets.rounds[index].drafted_ticket!, userRoundTickets, paginatedUserTickets.rounds[index]) > 0 ?
                                                                        "" + formatNumber(calcTotalRewards(paginatedUserTickets.rounds[index].drafted_ticket!, userRoundTickets, paginatedUserTickets.rounds[index]) / 1000000) + " SEFI" :
                                                                        " - "
                                                            }
                                                        </td>
                                                    </tr>
                                                    {
                                                        expandRow === index && renderExpandedRow(userRoundTickets, index)
                                                    }
                                                </React.Fragment>
                                            )
                                        }
                                    </tbody>
                                </table>
                                <div className="d-flex align-items-center">
                                    <div className="ml-auto mr-3">
                                        {paginatedUserTickets && paginatedUserTickets.user_tickets_round_total_count > 0 && "Total number of Rounds: " + paginatedUserTickets.user_tickets_round_total_count}
                                    </div>
                                    {
                                        paginatedUserTickets && paginatedUserTickets.user_tickets_round_total_count > 0 &&
                                        <nav aria-label="...">
                                            <ul className="pagination mb-0 my-3">
                                                <button className="page-item btn btn-secondary rounded-0"
                                                    disabled={paginationValues.page === 1}
                                                    onClick={() => handlePageChange(1)}>
                                                    <i className="fas fa-angle-double-left"></i>
                                                </button>
                                                <button className="page-item btn btn-secondary rounded-0" onClick={() => handlePageChange(paginationValues.page - 1 > 0 ? paginationValues.page - 1 : 1)}>
                                                    <i className="fas fa-angle-left"></i>
                                                </button>
                                                <button
                                                    className="page-item btn btn-secondary rounded-0"
                                                    onClick={() =>
                                                        handlePageChange(paginationValues.page + 1 < Math.ceil(paginatedUserTickets.user_tickets_round_total_count / paginationValues.page_size) ? paginationValues.page + 1 : Math.ceil(paginatedUserTickets.user_tickets_round_total_count / paginationValues.page_size))
                                                    }>
                                                    <i className="fas fa-angle-right"></i>
                                                </button>
                                                <button className="page-item btn btn-secondary rounded-0"
                                                    disabled={paginationValues.page === Math.ceil(paginatedUserTickets.user_tickets_round_total_count / paginationValues.page_size)}
                                                    onClick={() => handlePageChange(Math.ceil(paginatedUserTickets.user_tickets_round_total_count / paginationValues.page_size))}>
                                                    <i className="fas fa-angle-double-right"></i>
                                                </button>
                                            </ul>
                                        </nav>
                                    }
                                </div>
                            </Col>
                            <Col style={{ justifyContent: "center", marginLeft: "50px" }}>
                                <Row style={{ justifyContent: "center", margin: "0px" }}>
                                    <h2>Search previous Rounds</h2>
                                </Row>
                                {
                                    roundViewer &&
                                    <Row style={{ padding: "20px", borderRadius: "30px", border: "solid", marginTop: "20px", fontSize: "0.9rem" }}>
                                        <Col>
                                            <Row>
                                                <Col>
                                                    <span style={{ fontSize: "1.25rem", display: "block" }}>Round {roundViewer.round_number}</span>
                                                </Col>
                                                <Col>
                                                    <span style={{ fontSize: "1.25rem", display: "block" }}>{roundViewer.ticket_count} Tickets</span>
                                                </Col>
                                            </Row>
                                            <Row style={{ justifyContent: "center" }}>
                                                <Col>
                                                    <span style={{ fontSize: "1.75rem", display: "block" }}>{formatNumber(parseInt(roundViewer.final_pot_size ? roundViewer.final_pot_size : "0") / 1000000)} SEFI </span>
                                                </Col>
                                                <Col>
                                                    <span style={{ fontSize: "1.75rem", display: "block" }}>{roundViewer.drafted_ticket && roundViewer.drafted_ticket.split("").join(" ")}</span>
                                                </Col>
                                            </Row>
                                            <br />
                                            <Row>
                                                <table className='table table-borderless'>
                                                    <thead>
                                                        <tr>
                                                            <th scope="col">Sequence</th>
                                                            <th scope="col">Distributed Rewards (SEFI)</th>
                                                            <th scope="col">Winners</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                            </td>
                                                            <td>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_6_pot_size : "0") / 1000000)}</td>
                                                            <td>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_6_ticket_win_count : "0"}</td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                                            </td>
                                                            <td>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_5_pot_size : "0") / 1000000)}</td>
                                                            <td>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_5_ticket_win_count : "0"}</td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                                                <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                            </td>
                                                            <td>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_4_pot_size : "0") / 1000000)}</td>
                                                            <td>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_4_ticket_win_count : "0"}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                                                <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                                <i className="far fa-circle" style={{ margin: "5px" }}></i></td>
                                                            <td>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_3_pot_size : "0") / 1000000)}</td>
                                                            <td>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_3_ticket_win_count : "0"}</td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                                                <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                                <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                                <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                            </td>
                                                            <td>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_2_pot_size : "0") / 1000000)}</td>
                                                            <td>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_2_ticket_win_count : "0"}</td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                                                <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                                                <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                                <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                                <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                                <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                                            </td>
                                                            <td>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_1_pot_size : "0") / 1000000)}</td>
                                                            <td>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_1_ticket_win_count : "0"}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </Row>
                                            <Row>
                                                <Col>
                                                    <i className="fas fa-fire" style={{ margin: "2px", color: "#d9534f", marginLeft: "5px", marginRight: "10px" }}></i>Burn:
                                                    <span>{" " + formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.burn_pot_size : "0") / 1000000) + " SEFI"}</span>
                                                </Col>
                                                <Col>
                                                    <i className="fas fa-coins" style={{ margin: "2px", color: "#f0ad4e", marginLeft: "5px", marginRight: "10px" }}></i>Triggerer Fee:
                                                    <span>{" " + formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.triggerer_pot_size : "0") / 1000000) + " SEFI"}</span>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                }
                                <Row style={{ justifyContent: "flex-end", marginBottom: "20px" }}>
                                    <Form.Control type="number" placeholder="Round" min={0} style={{ textAlign: "center", width: "20%", borderRadius: "0px", marginTop: "20px" }}
                                        value={searchState}
                                        onChange={(e) => setSearchState(e.target.value)}
                                    />
                                    <button type="button" style={{ width: "10%", borderRadius: "0px", marginTop: "20px" }}
                                        disabled={
                                            searchState === "" ||
                                            parseInt(searchState) >= currentRoundsState.round_number
                                        }
                                        onClick={async () => {
                                            if (!client) return
                                            const response = await getRounds(client, constants.SECRET_LOTTERY_CONTRACT_ADDRESS, [parseInt(searchState)])
                                            console.log(response)
                                            setRoundViewer(response.rounds[0]);
                                        }}
                                        className="btn btn-info"><i className="fas fa-search"></i></button>
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                }
            </div>
        </div>
    )
}