import React from "react";
import Header from "./Header.js";
import "./general.css";
import { useNavigate } from "react-router-dom";

const PlacementHome = () => {
  let navigate = useNavigate();

  function handlePythonButton() {
    navigate('/python-package');
  };

  function handleResultsButton() {
    navigate('/placement')
  }

  return (
    <div>
      <Header />
      <h1 className="big_title">Electric Vehicle Charging Demand</h1>
      <div className="content" id="main">
        <div className="subtitle" id="live">Live Simulation</div>
        <p>
          This section of our research is focused on the applications of our findings. Using the data we
          have collected and analyzed, we were able to solve an optimization model
          to find the best locations to put BEV chargers. This result maximizes the
          Net Present Value (NPV) of installing these chargers, an estimate of the profitability
          of this venture. We have also published the code used to simulate, optimize and generate
          our results, which is linked below.
        </p>

        <div className="btnContent">
          <button className="btn-primary" onClick={handlePythonButton}>Python Package</button>
          <button className="btn-primary" onClick={handleResultsButton}>Charging Placement Results</button>
        </div>
      </div>
    </div>
  );
}

export default PlacementHome;