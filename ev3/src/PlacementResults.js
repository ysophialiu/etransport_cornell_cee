import Header from "./Header";
import React from "react";
import "./general.css";
import { useNavigate } from "react-router-dom";
function NavButton() {
  const navigate = useNavigate();
  return <button className="pageBtn" onClick={() => navigate("/python-package")}>Python Package</button>
}
export default class PlacementResult extends React.Component {

  render() {
    return (
      <div>
        <Header />
        <div className="big_title">Atlanta Charging Placement Case Study</div>
        <div className="content">
          <div>
            Atlanta Metropolitan area, located in Georgia, U.S. is
            the third-largest metropolitan region in the southeastern
            U.S. and the fourth-fastest-growing metropolitan area in the
            U.S. (Information on the placement case study goes here)
          </div>
          <div className="section"></div>
          <div className="btnContent">
            <NavButton />
          </div>
        </div>
      </div>
    )
  }
}