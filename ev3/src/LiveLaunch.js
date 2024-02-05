import React, { useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import Header from "./Header.js";
import "./general.css";
import "./metropolitan_demand.css";

const metroOptions = [{ value: "Atlanta", label: "Atlanta" }];

const shareOptions = [
  {value: "4000", label: "4,000"}, 
  {value: "4500", label: "4,500"}, 
  {value: "5000", label: "5,000"}, 
  {value: "5500", label: "5,500"},
  {value: "6000", label: "6,000"}, 
];

const LiveLaunch = () => {
  
  const [metroArea, setMetroArea] = useState("Atlanta");
  const [marketShare, setMarketShare] = useState('5000');

  let navigate = useNavigate();

  function handleDemandButton () {
    let newpathname;
    if(metroArea == "Atlanta"){
      newpathname = '/live-model/travel-demand/' + metroArea
    }

    navigate(newpathname, {
      state: {
        marketShare
      }}
    )
  };

  const onShareChange = ({target:{value}}) => setMarketShare(value);
  const onAreaChange = ({target:{value}}) => setMetroArea(value);

  return (
    <div>
      <Header/>
      <div className="big_title">Simulation Setup</div>
      <div className="content">
        <Form onSubmit={handleDemandButton}>
          <Form.Group as={Row} className="mb-3 px-5 justify-content-md-center" controlId="formDescription">
            <Form.Label column className="col text-center">
              Select inputs below to configure a BEV market to study.
              Trip chain simulation will be performed on the chosen BEV market 
              setting to model BEV users' travel demand and describe travel patterns.
              This research adopts the travel demand model developed by the Atlanta 
              Regional Commission (ARC ABM).
            </Form.Label>
          </Form.Group>

          <Form.Group as={Row} className="mb-3 justify-content-md-center" controlId="formArea">
            <Form.Label column md={2}>
              Metropolitan area
            </Form.Label>
            <Col md={4}>
              <Form.Select onChange={onAreaChange}>
                {metroOptions.map(opt => (
                  <option>{opt.label}</option>
                ))}
              </Form.Select>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3 justify-content-md-center" controlId="formShare">
            <Form.Label column md={2}>
              Number of BEVs
            </Form.Label>
            <Col md={4}>
              <Form.Select onChange={onShareChange} defaultValue={marketShare}>
                {shareOptions.map(opt => (
                  <option value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3 justify-content-md-center">
            <Col md={2}>
              <Button type="submit" className="pageBtn">Get Travel Demand</Button>
            </Col>
          </Form.Group>
        </Form>
      </div>
    </div>
  )
}

export default LiveLaunch;