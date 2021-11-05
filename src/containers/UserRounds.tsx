import React, { Dispatch, useContext, useEffect, useState } from "react"
import getPaginatedUserRounds, { IPaginatedUserRounds } from "../api/getPaginatedUserRounds";
import { IRound } from "../api/getRounds";
import constants from "../constants";
import { ClientContext, IClientState } from "../context/ClientContext";
import { PermitContext } from "../context/PermitContext";
import { ViewKeyContext } from "../context/ViewKeyContext";
import UserRoundTicketsModal from "./UserRoundTicketsModal";

export default ({
    paginatedUserRounds,
    getPaginatedUserTicketsTrigger,
    paginationValues,
    setRoundViewer
}: {
    paginatedUserRounds: IPaginatedUserRounds | null
    getPaginatedUserTicketsTrigger: Function,
    paginationValues: {
        page_size: number,
        page: number
    },
    setRoundViewer: Dispatch<IRound | null>
}) => {
    const client = useContext(ClientContext);
    const permit = useContext(PermitContext);

    const [userRoundTicketsModal, setUserRoundTicketsModal] = useState<{ show: boolean, selectedUserRound: IRound | null, userTicketsCount: number | null }>({
        show: false,
        selectedUserRound: null,
        userTicketsCount: null
    })


    useEffect(() => {
        if (client && permit) {
            getPaginatedUserTicketsTrigger(client, permit, paginationValues.page, paginationValues.page_size)
        }
    }, [client, permit])

    if (!client || !permit || !paginatedUserRounds) return null
    return (
        <React.Fragment>
            <div className="row" style={{ justifyContent: "center", margin: "0px" }}>
                <h2>Your Tickets</h2>
            </div>
            <table className="table table-striped table-dark" style={{ margin: "20px" }}>
                <thead>
                    <tr>
                        <th scope="col"></th>
                        <th scope="col">Round</th>
                        <th scope="col">End Date</th>
                        <th scope="col">Drafted Ticket</th>
                        <th scope="col">My Tickets</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        paginatedUserRounds &&
                        paginatedUserRounds.rounds.map((userRound, index) =>
                            <React.Fragment>
                                <tr key={index}>
                                    <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                        {
                                            userRound.drafted_ticket &&
                                            <button type="button" className="btn btn-secondary"
                                                onClick={() => {
                                                    //setSearchState("")
                                                    setRoundViewer(userRound)
                                                }}
                                            > <i className="fas fa-eye"></i></button>
                                        }
                                    </td>
                                    <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                        {userRound.round_number}
                                    </td>
                                    <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                        { }
                                    </td>
                                    <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                        {userRound.drafted_ticket ? userRound.drafted_ticket!.split('').join(' ') : " - "}
                                    </td>
                                    <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                        {
                                            <button className={`btn btn-info`} onClick={() => setUserRoundTicketsModal({ show: true, selectedUserRound: userRound, userTicketsCount: paginatedUserRounds.user_tickets_count[index] })}>
                                                {paginatedUserRounds.user_tickets_count[index] + " Tickets"}
                                            </button>
                                        }
                                    </td>
                                </tr>
                            </React.Fragment>
                        )
                    }
                </tbody>
            </table>

            <UserRoundTicketsModal
                userRoundTicketsModal={userRoundTicketsModal}
                setUserRoundTicketsModal={setUserRoundTicketsModal}
            />
        </React.Fragment>

    )
}