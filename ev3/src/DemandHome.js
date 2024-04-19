import React from "react";
import Header from "./Header.js";
import "./general.css";
import { useNavigate } from "react-router-dom";

const DemandHome = () => {
  let navigate = useNavigate();

  function handleSimulationButton() {
    navigate('/live-modelN');
  };

  function handleResultsButton() {
    navigate('/demand')
  }

  return (
    <div>
      <Header />
      <h1 className="big_title">Electric Vehicle Charging Demand</h1>
      <div className="content" id="main">
        <div className="subtitle" id="live">Live Simulation</div>
        <p>
          Demand simulation is a crucial part of our research, as it allows us to
          understand the nature of the BEV charging market. These results can
          then be analyzed and used in practical applications, for example, optimizing
          the placement of BEV chargers to generate the most value in the most efficient
          way possible.
        </p>

        <div className="btnContent">
          <button className="btn-primary" onClick={handleSimulationButton}>Electric Vehicle Demand Simulation</button>
          <button className="btn-primary" onClick={handleResultsButton}>Charging Demand Results</button>
        </div>
      </div>
    </div>
  );
}

export default DemandHome;