import React from "react";
import Header from "./Header";
import "./general.css"
import PlacementResult from "./PlacementResults.js"
import TableOfContents from "./TableOfContents.js";

const Placement = () => {
  return (
    <div>
      <Header />
      <h1 className="big_title">Electric Vehicle Charging Placement</h1>
      <div className="study-content">
        <div className="table-of-contents">
          <TableOfContents />
        </div>
        <div className="main-content">
          <PlacementResult />
        </div>
      </div>

    </div>
  );
};

export default Placement;
