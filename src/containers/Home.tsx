import { useContext, useEffect, useState } from "react"
import buyTickets from "../api/buyTickets"
import getBalance from "../api/getBalance"
import getConfigs, { Configs } from "../api/getConfigs"
import getRounds, { IRound } from "../api/getRounds"
import constants from "../constants"
import { BalancesDispatchContext } from "../context/BalancesContext"
import { ClientContext, IClientState } from "../context/ClientContext"
import { ViewKeyContext } from "../context/ViewKeyContext"

export default ({
    menu
} : {
    menu: string
}) => {
    const client = useContext(ClientContext);
    const viewkey = useContext(ViewKeyContext);

    const [configs, setConfigs] = useState<Configs | null>(null)
    const [currentRoundsState, setCurrentRoundsState] = useState<IRound | null>(null)

    useEffect(() => {
        if (client && viewkey) {
            getConfigsTrigger(client)
        }
    }, [client, viewkey])

    useEffect(() => {
        if (client && viewkey && configs) {
            getCurrentRound(client,configs.current_round_number);
        }
    }, [configs])

    const getConfigsTrigger = async (client: IClientState) => {
        const configs = await getConfigs(client, constants.SECRET_LOTTERY_CONTRACT_ADDRESS)
        setConfigs(configs)
    } 

    const getCurrentRound = async (client: IClientState, current_round: number) => {
        const currentRound = await getRounds(client, constants.SECRET_LOTTERY_CONTRACT_ADDRESS,[current_round])
        setCurrentRoundsState(currentRound.rounds[0])
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
                <button type="button" className="btn btn-success" style={{ borderRadius: "10px", margin: "5px" }}
                    onClick={() => {
                        if (!currentRoundsState) return 
                        const tickets = ["123456"]
                        buyTickets(
                            client,
                            constants.SEFI_CONTRACT_ADDRESS,
                            constants.SECRET_LOTTERY_CONTRACT_ADDRESS,
                            tickets,
                            "" + parseInt(currentRoundsState.round_ticket_price) * tickets.length
                            )}
                    }>
                    Buy Tickets
                </button>
            </div>
        </div>  
    )
} 