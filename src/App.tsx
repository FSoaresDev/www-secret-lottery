import React, { Dispatch, useEffect, useState } from 'react';
import ClientContextProvider, { ClientContext, ClientDispatchContext, IClientState } from "./context/ClientContext";
import ReactNotification from 'react-notifications-component'
import logo from './logo.svg';
import './App.css';
import { SigningCosmWasmClient } from 'secretjs';
import KeplrSetup from './containers/KeplrSetup';
import NavBar from './containers/NavBar';
import CreateViewkey from './containers/CreateViewkey';
import ViewKeyContextProvider, { ViewKeyContext } from './context/ViewKeyContext';
import BalancesContextProvices from './context/BalancesContext';
import ConfigsContextProvider, { ConfigsContext } from './context/LotteryConfigsContext';
import Home from './containers/Home';
import {
  HashRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom";
import CurrentRoundSection from './containers/CurrentRoundSection';
import { Col, Container, Row } from 'react-bootstrap';
import UserRounds from './containers/UserRounds';
import getPaginatedUserRounds, { IPaginatedUserRounds } from './api/getPaginatedUserRounds';
import constants from './constants';
import RoundViewer from './containers/RoundViewer';
import { IRound } from './api/getRounds';

function App() {
  const [roundViewer, setRoundViewer] = useState<IRound | null>(null);
  const [paginatedUserRounds, setPaginatedUserRounds] = useState<IPaginatedUserRounds | null>(null);
  const [paginationValues, setPaginationsValues] = useState<{
    page_size: number,
    page: number
  }>({
    page_size: 5,
    page: 1
  })

  const getPaginatedUserTicketsTrigger = async (client: IClientState, viewkey: string, page: number, page_size: number) => {
    const paginatedUserTickets = await getPaginatedUserRounds(client, constants.SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, page - 1, page_size)
    setPaginatedUserRounds(paginatedUserTickets);
  }

  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path="/">
            <ClientContextProvider>
              <ViewKeyContextProvider>
                <BalancesContextProvices>
                  <ConfigsContextProvider>
                    <div style={{ background: "linear-gradient(180deg, #242525 0%, #000 180%)", width: "100%", minHeight: "100vh" }}>
                      <ReactNotification />
                      <KeplrSetup />
                      <NavBar menu={"SEFI"} />
                      <Container fluid style={{ width: "80%", color: "white" }}>
                        <CreateViewkey menu={"SEFI"} />
                        <Row>
                          <CurrentRoundSection
                            getPaginatedUserTicketsTrigger={getPaginatedUserTicketsTrigger}
                            paginationValues={paginationValues}
                          />
                        </Row>
                        <Row>
                          <div style={{ backgroundColor: "white", height: "1px", width: "100%", marginTop: "30px", marginBottom: "30px", }}>
                          </div>
                        </Row>
                        <Row>
                          <Col xs={7}>
                            <UserRounds
                              paginatedUserRounds={paginatedUserRounds}
                              getPaginatedUserTicketsTrigger={getPaginatedUserTicketsTrigger}
                              paginationValues={paginationValues}
                              setRoundViewer={setRoundViewer}
                            />
                          </Col>
                          <Col style={{ justifyContent: "center", marginLeft: "50px" }}>
                              <RoundViewer 
                                roundViewer={roundViewer}
                                setRoundViewer={setRoundViewer}
                              /> 
                          </Col>
                        </Row> 
                      </Container>
                      { 
                        //<Home menu={"SEFI"}/>
                      }
                    </div>
                  </ConfigsContextProvider>
                </BalancesContextProvices>
              </ViewKeyContextProvider>
            </ClientContextProvider>
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;