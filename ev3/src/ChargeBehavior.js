import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button, Col, Form, Row, Table } from "react-bootstrap";
import Header from "./Header.js";
import RedirectBack from "./RedirectBack.js";
import "./general.css";
import "./result.css";

const ChargeDemand = () => {
  const { area } = useParams();
  let navigate = useNavigate();

  const [values, setValues] = useState({
    BEVgroupShares: ['30', '60', '10'],
    riskSensitivity: 'risk-medium',
    willingnessToPay: 'willingness-neutral',
    rangeBuffer: 'buffer-20'
  })
  const [formerrors, setFormErrors] = useState({});

  const { state } = useLocation();
  if (!state || !state.EV_sample || !state.trip_sample) {
    return <RedirectBack/>
  }

  const handleChangeRadio = (event) => {
    setValues((values) => ({
      ...values,
      [event.target.name]: event.target.id,
    }));
   };

  const handleChangeArray = (event) => {
    let curList = values.BEVgroupShares;
    const index = parseInt(event.target.name.charAt(5)) - 1
    curList[index] = event.target.value
    setValues((values) => ({
      ...values,
      BEVgroupShares: curList
    }))
  }

  const validate = () => {
    let errors = {};

    const [one, two, three] = values.BEVgroupShares
    if (!one) { errors.group1share = 'Required' }
    if (!two) { errors.group2share = 'Required' }
    if (!three) { errors.group3share = 'Required' }

    if (one && two && three && parseInt(one)+parseInt(two)+parseInt(three)!==100) {
      errors.BEVgroupShares = 'Must sum to 100'
    }    

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSimButton = (event) => {
    event.preventDefault();
    if (validate(values)) {
      if(area == "Atlanta"){
        navigate("/live-model/charging-demand/" + area, {
        state: {
          ...state,
          ...values
        }}
        )
      }
    }
  }

  return (
    <div>
      <Header/>
      <div className="big_title">Charging Demand Model</div>
      <div className="content">
        <Form onSubmit={handleSimButton}>
          <div className="subtitle">EVSE Market Setting</div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th> </th>
                <th>BEV group 1</th>
                <th>BEV group 2</th>
                <th>BEV group 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Model Examples</td>
                <td>Nissan Leaf, Fiat 500e</td>
                <td>Tesla Model S, Chevrolet Bolt</td>
                <td>Tesla Model X</td>
              </tr>
              <tr>
                <td>Electric Capacity</td>
                <td>40 kWh</td>
                <td>100 kWh</td>
                <td>100 kWh</td>
              </tr>
              <tr>
                <td>Energy Consumption Rate</td>
                <td>0.3 kWh/mi</td>
                <td>0.3 kWh/mi</td>
                <td>0.35 kWh/mi</td>
              </tr>
              <tr>
                <td>Market Share (%)
                {formerrors.BEVgroupShares && (
                  <div className="text-danger">{formerrors.BEVgroupShares}</div>
                )}
                </td>
                <td>
                  <Form.Control id="share-1" name="group1share" onChange={handleChangeArray} value={values.BEVgroupShares[0]}/>
                  {formerrors.group1share && (
                    <div className="text-danger">{formerrors.group1share}</div>
                  )}
                </td>
                <td>
                  <Form.Control id="share-2" name="group2share" onChange={handleChangeArray} value={values.BEVgroupShares[1]}/>
                  {formerrors.group2share && (
                    <div className="text-danger">{formerrors.group2share}</div>
                  )}
                </td>
                <td>
                  <Form.Control id="share-3" name="group3share" onChange={handleChangeArray} value={values.BEVgroupShares[2]}/>
                  {formerrors.group3share && (
                    <div className="text-danger">{formerrors.group3share}</div>
                  )}
                </td>
              </tr>
            </tbody>
          </Table>

          <div className="section">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Charging Mode</th>
                  <th>Charging Rate</th>
                  <th>Charging Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Home</td>
                  <td>L2</td>
                  <td>3.6 kW</td>
                  <td>$0.13/kWh</td>
                </tr>
                <tr>
                  <td rowSpan={2}>Work/Public</td>
                  <td>L2</td>
                  <td>6.2 kW</td>
                  <td rowSpan={2}>$0.43/kWh</td>
                </tr>
                <tr>
                  <td>DCFC</td>
                  <td>150 kW</td>
                </tr>
              </tbody>
            </Table>
          </div>

          <div className="section">
            <div className="subtitle">Charging Behavior Setting</div>
            <Row className="mb-4">
              <Col md={4}>
                <Form.Label className="fw-bold">Risk Sensitivity</Form.Label>
                <div key={`inline-radio-risk`} className="mb-3">
                  <Form.Check
                    label="Low"
                    name="riskSensitivity"
                    type='radio'
                    id='risk-low'
                    checked={values.riskSensitivity === 'risk-low'}
                    onChange={handleChangeRadio}
                  />
                  <Form.Check
                    label="Medium"
                    name="riskSensitivity"
                    type='radio'
                    id='risk-medium'
                    checked={values.riskSensitivity === 'risk-medium'}
                    onChange={handleChangeRadio}
                  />
                  <Form.Check
                    label="High"
                    name="riskSensitivity"
                    type='radio'
                    id='risk-high'
                    checked={values.riskSensitivity === 'risk-high'}
                    onChange={handleChangeRadio}
                  />
                </div>
              </Col>
              <Col>
                <div>High-risk-sensitive users are more sensitive to a decrease in the SOC 
                (state of charge) and are more likely to charge as long as the BEV is not fully charged. 
                Low-risk-sensitive users do not start charging until the SOC approximates the 
                range buffer.</div>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={4}>
              <Form.Label className="fw-bold">Preference for Charging Rate</Form.Label>
                <div key={`inline-radio-willingness`} className="mb-3">
                  <Form.Check
                    label="Negative (dislike fast charge) "
                    name="willingnessToPay"
                    type='radio'
                    id='willingness-negative'
                    checked={values.willingnessToPay === 'willingness-negative'}
                    onChange={handleChangeRadio}
                  />
                  <Form.Check
                    label="Zero (neutral)"
                    name="willingnessToPay"
                    type='radio'
                    id='willingness-neutral'
                    checked={values.willingnessToPay === 'willingness-neutral'}
                    onChange={handleChangeRadio}
                  />
                  <Form.Check
                    label="Positive (prefer fast charge)"
                    name="willingnessToPay"
                    type='radio'
                    id='willingness-positive'
                    checked={values.willingnessToPay === 'willingness-positive'}
                    onChange={handleChangeRadio}
                  />
                </div>
              </Col>
              <Col>
                <div>Preference for charging rate can be positive if users want to reduce 
                the charging duration, or negative if users have concerns about battery 
                deterioration. If users prefer faster charging, charging rate positively 
                affects charging choice. If users dislike fast charging, charging rate 
                negatively affects charging choice.</div>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={4}>
              <Form.Label className="fw-bold">Range Buffer</Form.Label>
                <div key={`inline-radio-buffer`} className="mb-3">
                  <Form.Check
                    label="10%"
                    name="rangeBuffer"
                    type='radio'
                    id='buffer-10'
                    checked={values.rangeBuffer === 'buffer-10'}
                    onChange={handleChangeRadio}
                  />
                  <Form.Check
                    label="20%"
                    name="rangeBuffer"
                    type='radio'
                    id='buffer-20'
                    checked={values.rangeBuffer === 'buffer-20'}
                    onChange={handleChangeRadio}
                  />
                  <Form.Check
                    label="30%"
                    name="rangeBuffer"
                    type='radio'
                    id='buffer-30'
                    checked={values.rangeBuffer === 'buffer-30'}
                    onChange={handleChangeRadio}
                  />
                </div>
              </Col>
              <Col>
                <div>The range buffer is the minimum SOC level users want to maintain. 
                If the end-of-trip SOC is lower than the range buffer, users tend 
                to charge; otherwise, they tend not to charge.</div>
              </Col>
            </Row>
          </div>

          <Form.Group as={Row} className="mb-3 justify-content-md-center">
            <Col sm={2}>
              <Button className="pageBtn" type="button" onClick={() => navigate(-1)}>
                {'< Back'}
              </Button>
            </Col>
            <Col md={3}>
              <Button className="pageBtn" type="submit">
                {'Get Charging Demand >'}
              </Button>
            </Col>
          </Form.Group>
          
          <Row className="mb-3 justify-content-md-center">
            <Col className="text-center">
            {Object.keys(formerrors).length > 0 && 
              <div className="text-danger">
                There are errors that must be fixed before proceeding.
              </div>
            }
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}

export default ChargeDemand;