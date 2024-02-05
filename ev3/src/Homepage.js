import React from "react";
import Header from "./Header.js";
import "./general.css";
import { navigate } from "@reach/router";
import {useNavigate} from "react-router-dom";
const Homepage = () => {
    let navigate = useNavigate()
    function handleAtlantaButton() {
    navigate('/atlanta-result', { state: {
        metro_value: "Atlanta",
        share_value: "10"
      }}
    )
  };
    function handleSimulationButton() {
    navigate('/live-modelN')
  }
  return (
    <div>
      <Header />
      <h1 className="big_title">Electric Vehicle Charging Demand</h1>
      <div className="content" id="main">
        <h2 className="subtitle">Introduction</h2>
        <p>
          Battery electric vehicles (BEVs), vehicles that run solely
          on electricity and produce no emissions during operation,
          have emerged as a potentially reliable solution for a future
          zero-emission transportation system. The BEV market has grown
          rapidly since 2011, with an average annual growth rate of 48.8%.
          By 2019, annual BEV sales in the U.S. increased to 242,000, and
          the number of BEVs registered nationwide is projected to reach
          7.5 million by 2030.
        </p>

        <p>
          However, the expansion of the BEV market will require a more
          rapid increase in demand for electric charging equipment. To
          this end, a better understanding of BEV charging demand at the
          micro level is critical for optimal charging infrastructure
          planning and electricity load management.
        </p>

        <p>
          To address this research gap, we have developed an integrated
          activity-based BEV charging demand simulation model that
          accounts for both realistic travel and charging behavior
          and provides high-resolution spatio-temporal demand in
          real-world applications. For more information about the
          scientific foundation of this work, interested readers are
          encouraged to visit our research article.
        </p>
        <div className="btnContent">
        <button className="pageBtn" onClick={handleAtlantaButton}>Case study - Atlanta Metropolitan Area</button>
        <button className="pageBtn" onClick={handleSimulationButton}>Electric Vehicle Demand Simulation</button>
        </div>
      </div>
    </div>
  );
}

export default Homepage;


