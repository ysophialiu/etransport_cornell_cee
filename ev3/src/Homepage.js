import React from "react";
import Header from "./Header.js";
import "./general.css";
import {useNavigate} from "react-router-dom";

const Homepage = () => {
    let navigate = useNavigate();

    function handleDemandButton() {
      navigate('/demand');
    };

    function handlePlacementButton() {
      navigate('/placement');
    }

    function handlePackageButton() {
      navigate('/python-package');
    }

    return (
      <div>
        <Header />
        <h1 className="big_title">Transportation Electrification Homepage</h1>
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
            This expansion of the BEV market will create a rapidly increasing 
            demand for electric charging equipment. Thus, it is crucial to gain a 
            better understanding of BEV charging demands and placements at the micro 
            level in order to produce solutions for optimal charging infrastructure 
            and electricity load management.
          </p>

          <h2 className="subtitle">Case Study: Atlanta Metropolitan Area</h2>
          <p>
            Atlanta Metropolitan area, located in Georgia, U.S. is
            the third-largest metropolitan region in the southeastern
            U.S. and the fourth-fastest-growing metropolitan area in the
            U.S. The area contains 21 counties and 5922 Traffic analytic
            zones (TAZs). For more information about the region, please visit
            the <a href="https://atlantaregional.org">Atlanta Regional Commission (ARC)</a>.
          </p>

          <p>
            In this transportation electrification hub, we provide insights into 
            optimal charging demands and placements via case studies performed on 
            the Atlanta Metropolitan area. Navigations to each module are provided below.
          </p>

          <div className="btnContent">
            <button className="btn-primary" onClick={handleDemandButton}>Charging Demand Module</button>
            <button className="btn-primary" onClick={handlePlacementButton}>Charging Placement Module</button>
            <button className="btn-primary" onClick={handlePackageButton}>Python Package</button>
          </div>
        </div>
      </div>
    );
}

export default Homepage;
