export default (numberOfTickets: number) => {
    let result           = [];
    const characters       = '0123456789';
    const charactersLength = 6;
    for(var j=0; j < numberOfTickets; j++){
        let ticket = "";
        for ( var i = 0; i < charactersLength; i++ ) {
            ticket += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        result.push(ticket)
    }

    return result;
}