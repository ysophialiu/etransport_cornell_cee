import React from "react";
import Header from "./Header";
import "./general.css"
import PlacementResult from "./PlacementResults.js"

const Placement = () => {
  return (
    <div>
      <Header />
      <h1 className="big_title">Electric Vehicle Charging Placement</h1>
      
      <PlacementResult />

    </div>
  );
};

export default Placement;
