import React, { Dispatch, useEffect, useState } from 'react';
import ClientContextProvider, { ClientContext, ClientDispatchContext } from "./context/ClientContext";
import ReactNotification from 'react-notifications-component'
import logo from './logo.svg';
import './App.css';
import { SigningCosmWasmClient } from 'secretjs';
import KeplrSetup from './containers/KeplrSetup';
import NavBar from './containers/NavBar';
import CreateViewkey from './containers/CreateViewkey';
import ViewKeyContextProvider, { ViewKeyContext } from './context/ViewKeyContext';
import BalancesContextProvices from './context/BalancesContext';
import Home from './containers/Home';
import {
  HashRouter as Router,
  Switch,
  Route,
  Link, 
  Redirect
} from "react-router-dom";



function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path="/">
            <ClientContextProvider> 
              <ViewKeyContextProvider>
                <BalancesContextProvices>
                    <div style={{ background: "linear-gradient(180deg, #242525 0%, #000 180%)", width: "100%", minHeight: "100vh" }}>
                      <ReactNotification />
                      <KeplrSetup />
                      <NavBar menu={"SEFI"}/>
                      <CreateViewkey menu={"SEFI"}/>
                      <Home menu={"SEFI"}/>
                    </div>
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