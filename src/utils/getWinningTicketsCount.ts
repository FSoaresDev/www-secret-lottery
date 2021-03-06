import { IUserTicket } from "../api/getUserRoundPaginatedTickets"

export default (draftedTicket: string, tickets: IUserTicket[]) => {
    let count = 0
    for (let ticket of tickets) {
        if (ticket.ticket.substring(0, 1) === draftedTicket.substring(0, 1)) count = count + 1;
    }

    return count
}