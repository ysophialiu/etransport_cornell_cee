import React from "react";
import Header from "./Header";
import "./general.css"
import { useNavigate } from "react-router-dom";

const Placement = () => {
  let navigate = useNavigate();
  function navigateLink(link) { return () => navigate(link); }
  return (
    <div>
      <Header />
      <h1 className="big_title">Electric Vehicle Charging Placement Model</h1>
      <div className="content">
        <h2 className="subtitle">Introduction</h2>
        <p>
          Introduction for the Charging placement model goes here
        </p>
        <div className="btnContent">
          <button className="pageBtn" onClick={navigateLink("/atlanta-placement")}>Case study - Atlanta Metropolitan Area</button>
          <button className="pageBtn" onClick={navigateLink("/python-package")}>Python Package</button>
        </div>
      </div>
    </div>
  )
}
export default Placement;