import React from "react";
import Header from "./Header";
import "./general.css";

const PythonPackage = () => {
  return (
    <div>
      <Header />
      <h1 className="big_title">Python Package</h1>
      <div className="content">
        <p>
          The results of our research are generated from simulations run by a set of
          Python programs based on our models. These tools have been compiled into a
          Python package, which is available to download here.
        </p>
        <div className="btnContent">
          <button className="btn-primary"> Download the Transport Electrification Python Package</button>
        </div>
      </div>
    </div>
  );
}

export default PythonPackage;