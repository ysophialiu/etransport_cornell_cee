import React from "react";
import Header from "./Header.js";
import "./general.css";
import {useNavigate} from "react-router-dom";
import Result from "./result.js"

const Demand = () => {
    let navigate = useNavigate();

    function handleSimulationButton() {
      navigate('/live-modelN');
    };
    
    return (
      <div>
        <Header />
        <h1 className="big_title">Electric Vehicle Charging Demand</h1>
        <div className="content">

          <Result />
        
          <h2 className="subtitle">Live Simulation</h2>
          <p>
            We have developed an integrated activity-based BEV charging demand 
            simulation model that accounts for both realistic travel and charging 
            behavior and provides high-resolution spatio-temporal demand in
            real-world applications. For more information about the
            scientific foundation of this work, interested readers are
            encouraged to visit our research article.
          </p>
        
          <div className="btnContent">
            <button className="btn-primary" onClick={handleSimulationButton}>Electric Vehicle Demand Simulation</button>
          </div>
        </div>
      </div>
    );
}

export default Demand;