import React, { useState, useEffect } from "react";
import { Button, Col, Form, Row ,Table} from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import Header from "./Header.js";
import "./general.css";
import "./metropolitan_demand.css";
import MapChart from "./MapChart";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCircleQuestion, faQuestionCircle} from '@fortawesome/free-solid-svg-icons';
import ReactTooltip from 'react-tooltip';

const metroOptions = [
  { value: "Alabama", label: "Alabama" },
  { value: "Alaska", label: "Alaska" },
  { value: "Arizona", label: "Arizona" },
  { value: "Arkansas", label: "Arkansas" },
  { value: "California", label: "California" },
  { value: "Colorado", label: "Colorado" },
  { value: "Connecticut", label: "Connecticut" },
  { value: "Delaware", label: "Delaware" },
  { value: "Florida", label: "Florida" },
  { value: "Georgia", label: "Georgia" },
  { value: "Hawaii", label: "Hawaii" },
  { value: "Idaho", label: "Idaho" },
  { value: "Illinois", label: "Illinois" },
  { value: "Indiana", label: "Indiana" },
  { value: "Iowa", label: "Iowa" },
  { value: "Kansas", label: "Kansas" },
  { value: "Kentucky", label: "Kentucky" },
  { value: "Louisiana", label: "Louisiana" },
  { value: "Maine", label: "Maine" },
  { value: "Maryland", label: "Maryland" },
  { value: "Massachusetts", label: "Massachusetts" },
  { value: "Michigan", label: "Michigan" },
  { value: "Minnesota", label: "Minnesota" },
  { value: "Mississippi", label: "Mississippi" },
  { value: "Missouri", label: "Missouri" },
  { value: "Montana", label: "Montana" },
  { value: "Nebraska", label: "Nebraska" },
  { value: "Nevada", label: "Nevada" },
  { value: "NewHampshire", label: "New Hampshire" },
  { value: "NewJersey", label: "New Jersey" },
  { value: "NewMexico", label: "New Mexico" },
  { value: "NewYork", label: "New York" },
  { value: "NorthCarolina", label: "North Carolina" },
  { value: "NorthDakota", label: "North Dakota" },
  { value: "Ohio", label: "Ohio" },
  { value: "Oklahoma", label: "Oklahoma" },
  { value: "Oregon", label: "Oregon" },
  { value: "Pennsylvania", label: "Pennsylvania" },
  { value: "RhodeIsland", label: "Rhode Island" },
  { value: "SouthCarolina", label: "South Carolina" },
  { value: "SouthDakota", label: "South Dakota" },
  { value: "Tennessee", label: "Tennessee" },
  { value: "Texas", label: "Texas" },
  { value: "Utah", label: "Utah" },
  { value: "Vermont", label: "Vermont" },
  { value: "Virginia", label: "Virginia" },
  { value: "Washington", label: "Washington" },
  { value: "WestVirginia", label: "West Virginia" },
  { value: "Wisconsin", label: "Wisconsin" },
  { value: "Wyoming", label: "Wyoming" }
];


const LiveLaunch = () => {

  const handleStateClick = (stateName) => {
        setMetroArea(stateName);
  }

  const [homePrice, setHomePrice] = useState(0.13);
  const [publicPrice, setPublicPrice] = useState(0.43);
  const [homePriceError, setHomePriceError] = useState('');
  const [publicPriceError, setPublicPriceError] = useState('');

  const [L2, setL2] = useState(1);
  const [DCFC, setDCFC] = useState(1);
  const [L2Error, setL2Error] = useState('');
  const [DCFCError, setDCFCError] = useState('');

  //const [NV, setNV] = useState(5000);
  const [NVError, setNVError] = useState('');

  const [marketShare, setMarketShare] = useState('50000'); //Use 50000 by default

  const [metroArea, setMetroArea] = useState("Alabama");
  const [dayType, setDayType] = useState('weekday');
  const [formerrors, setFormErrors] = useState({});

  const [values, setValues] = useState({
    BEVgroupShares: ['30', '60', '10'],
    riskSensitivity: 'risk-medium',
    willingnessToPay: 'willingness-neutral',
    rangeBuffer: 'buffer-20',
    marketShare: marketShare,
    homePrice:homePrice,
    publicPrice:publicPrice,
    L2:L2,
    DCFC:DCFC
  })

  let navigate = useNavigate();
  const handleChangeRadio = (event) => {
    setValues((values) => ({
      ...values,
      [event.target.name]: event.target.id,
    }));
   };

  useEffect(() => {
  setValues(values => ({ ...values, homePrice, publicPrice, L2, DCFC, marketShare}));
}, [homePrice, publicPrice,L2,DCFC,marketShare]);

  const handleChangeArray = (event) => {
    let curList = values.BEVgroupShares;
    const index = parseInt(event.target.name.charAt(5)) - 1
    curList[index] = event.target.value
    setValues((values) => ({
      ...values,
      BEVgroupShares: curList
    }))
  }
  function handleDemandButton () {
    let newpathname;
    newpathname = '/live-modelN/travel-demandN/' + metroArea

    navigate(newpathname, {
      state: {
        marketShare,
        dayType
      }}
    )
  };
  const handleSimButton = (event) => {
    event.preventDefault();
  
    const isValid = validate();
    if (isValid) {
      navigate("/live-modelN/charging-demandN/" + metroArea, {
        state: {
          dayType,
          ...values
        }
      });
    } else {
      console.log('Form validation failed');
    }
  };
  const onAreaChange = ({target:{value}}) => setMetroArea(value);
  const onDayTypeChange = ({target:{value}}) => setDayType(value);

  const validate = () => {
    let errors = {};

    const [one, two, three] = values.BEVgroupShares
    if (!one) { errors.group1share = 'Required' }
    if (!two) { errors.group2share = 'Required' }
    if (!three) { errors.group3share = 'Required' }

    if (one && two && three && parseInt(one)+parseInt(two)+parseInt(three)!==100) {
      errors.BEVgroupShares = 'Must sum to 100'
    }

    if (isNaN(parseFloat(values.homePrice)) || parseFloat(values.homePrice) < 0) {
      errors.homePriceError = 'Invalid home charging price';
    }
    if (isNaN(parseFloat(values.publicPrice)) || parseFloat(values.publicPrice) < 0) {
      errors.publicPriceError = 'Invalid public charging price';
    }
  
    if (isNaN(parseFloat(values.L2)) || parseFloat(values.L2) < 0 || parseFloat(values.L2) > 1) {
      errors.L2Error = 'L2 rate must be between 0 and 1';
    }
    if (isNaN(parseFloat(values.DCFC)) || parseFloat(values.DCFC) < 0 || parseFloat(values.DCFC) > 1) {
      errors.DCFCError = 'DCFC rate must be between 0 and 1';
    }
  
    const numericNV = parseInt(values.marketShare, 10);
    if (isNaN(numericNV) || numericNV < 10000 || numericNV > 10000000) {
      errors.NVError = 'Number of vehicles must be between 10,000 and 10,000,000';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handlePriceChange = (type, value) => {
    const isPartialInput = value.match(/^\d*\.?\d*$/) !== null;

    if (isPartialInput) {
      if (type === 'home') {
        setHomePrice(value);
        setHomePriceError('');
      } else if (type === 'public') {
        setPublicPrice(value);
        setPublicPriceError('');
      }
    } else {
      const errorMessage = 'Illegal input';
      if (type === 'home') {
        setHomePriceError(errorMessage);
      } else if (type === 'public') {
        setPublicPriceError(errorMessage);
      }
    }
  }

  const handleBlur = (type, value) => {
    if (!value) {
      if (type === 'home') {
        setHomePrice('0.13');
        setHomePriceError('');
      } else if (type === 'public') {
        setPublicPrice('0.43');
        setPublicPriceError('');
      }
    } else {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && numericValue >= 0) {
        if (type === 'home') {
          setHomePrice(numericValue.toString());
          setHomePriceError('');
        } else if (type === 'public') {
          setPublicPrice(numericValue.toString());
          setPublicPriceError('');
        }
      } else {
        const errorMessage = 'Please enter a valid positive number.';
        if (type === 'home') {
          setHomePriceError(errorMessage);
        } else if (type === 'public') {
          setPublicPriceError(errorMessage);
        }
      }
    }
  }


  const handleInputChange = (name, value) => {
    const isPartialInput = value.match(/^\d*\.?\d*$/) !== null;

    if (isPartialInput) {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && numericValue > 1) {
        if (name === 'L2') {
          setL2(1);
          setL2Error('');
        } else if (name === 'DCFC') {
          setDCFC(1);
          setDCFCError('');
        }
      } else {
        if (name === 'L2') {
          setL2(value);
          setL2Error('');
        } else if (name === 'DCFC') {
          setDCFC(value);
          setDCFCError('');
        }
      }
    } else {
      const errorMessage = 'Illegal input';
      if (name === 'L2') {
        setL2Error(errorMessage);
      } else if (name === 'DCFC') {
        setDCFCError(errorMessage);
      }
    }
  }

  const handleBlur_2 = (name, value) => {
    if (!value) {
      if (name === 'L2') {
        setL2('1');
        setL2Error('');
      } else if (name === 'DCFC') {
        setDCFC('1');
        setDCFCError('');
      }
    } else {
      const numericValue = parseFloat(value);
      const isValid = !isNaN(numericValue) && numericValue >= 0 && numericValue <= 1;

      if (isValid) {
        if (name === 'L2') {
          setL2(numericValue.toString());
          setL2Error('');
        } else if (name === 'DCFC') {
          setDCFC(numericValue.toString());
          setDCFCError('');
        }
      } else {
        const errorMessage = 'Illegal input';
        if (name === 'L2') {
          setL2Error(errorMessage);
        } else if (name === 'DCFC') {
          setDCFCError(errorMessage);
        }
      }
    }
  }

  const handleInputChangeNSV = (name, value) => {
    if (name === 'NV') {
      const numericValue = parseInt(value, 10);

      if (!isNaN(numericValue)) {
        setMarketShare(numericValue.toString());
      } else {
        setMarketShare('');
      }
    }
  }


  const handleBlur_2NSV = (name, value) => {
    const numericValue = parseFloat(value);
    if (!value || isNaN(numericValue) || numericValue < 10000 || numericValue > 10000000) {
      if (name === 'NV') {
        setMarketShare('50000')
        setNVError('');
      }
    } else {
      if (name === 'NV') {
        setMarketShare(numericValue.toString());
        setNVError('');
      }
    }
  }

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
              State:
            </Form.Label>
            <Col md={4}>
              <Form.Select onChange={onAreaChange} value={metroArea}>
                {metroOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value}</option>
                ))}
              </Form.Select>
            </Col>
          </Form.Group>

          <MapChart onStateClick={handleStateClick} selectedState={metroArea} />

        </Form>
      </div>
      <div className="content">
        <Form onSubmit={handleSimButton}>

          <div className="subtitle-small-five">BEV market setting</div>

            <Table striped bordered hover>
            <thead>
              <tr>
                <th> </th>
                <th className="table-col">BEV group 1</th>
                <th className="table-col">BEV group 2</th>
                <th className="table-col">BEV group 3</th>
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
                <td>Market Share (%) <span data-tip data-for="tooltipId2">
            <FontAwesomeIcon icon={faCircleQuestion} style={{ color: "#556482", marginLeft: "10px" }} />
          </span>
          <ReactTooltip id="tooltipId2" effect="solid" className="custom-tooltip">
            <span>Please Enter Market Share</span><br />
            <span>the sum should be 100</span>
          </ReactTooltip>
                {formerrors.BEVgroupShares && (
                  <div className="text-danger">{formerrors.BEVgroupShares}</div>
                )}
                </td>
                <td>
                  <Form.Control className="half-width-input" id="share-1" name="group1share" onChange={handleChangeArray} value={values.BEVgroupShares[0]}/>
                  {formerrors.group1share && (
                    <div className="text-danger">{formerrors.group1share}</div>
                  )}
                </td>
                <td>
                  <Form.Control className="half-width-input" id="share-2" name="group2share" onChange={handleChangeArray} value={values.BEVgroupShares[1]}/>
                  {formerrors.group2share && (
                    <div className="text-danger">{formerrors.group2share}</div>
                  )}
                </td>
                <td>
                  <Form.Control className="half-width-input" id="share-3" name="group3share" onChange={handleChangeArray} value={values.BEVgroupShares[2]}/>
                  {formerrors.group3share && (
                    <div className="text-danger">{formerrors.group3share}</div>
                  )}
                </td>
              </tr>
            </tbody>
          </Table>

          <div className="subtitle-small-five" style={{ marginTop: '50px' }}>Charging Price Setting</div>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th className="table-col">Location</th>
                  <th className="table-col">Charging Mode</th>
                  <th className="table-col">Charging Rate</th>
                  <th className="table-col">Charging Price ($/kWh)
                    <span data-tip data-for="tooltipId3">
                    <FontAwesomeIcon icon={faCircleQuestion} style={{ color: "#556482", marginLeft: "10px" }} />
                  </span>
                  <ReactTooltip id="tooltipId3" effect="solid" className="custom-tooltip">
                    <span>Please enter numbers greater than or equal to 0 as the Charging Price</span><br />
                  </ReactTooltip></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Home</td>
                  <td>L2</td>
                  <td>3.6 kW</td>
                  <td>
                    <Form.Control
                      className="half-width-input"
                      type="text"
                      pattern="^\d*(\.\d*)?$"
                      value={homePrice}
                      onChange={(e) => handlePriceChange('home', e.target.value)}
                      onBlur={(e) => handleBlur('home', e.target.value)}
                    />
                    {homePriceError && <div className="text-danger">{homePriceError}</div>}
                  </td>
                </tr>
                <tr>
                  <td rowSpan={2}>Work/Public</td>
                  <td>L2</td>
                  <td>6.2 kW</td>
                  <td rowSpan={2} style={{ verticalAlign: 'middle' }}>
                    <Form.Control
                      className="half-width-input"
                      type="text"
                      pattern="^\d*(\.\d*)?$"
                      value={publicPrice}
                      onChange={(e) => handlePriceChange('public', e.target.value)}
                      onBlur={(e) => handleBlur('public', e.target.value)}
                    />
                    {publicPriceError && <div className="text-danger">{publicPriceError}</div>}
                  </td>
                </tr>
                <tr>
                  <td>DCFC</td>
                  <td>150 kW</td>
                </tr>
              </tbody>
            </Table>

            <div className="subtitle-small-five" style={{ marginTop: '50px' }}>Public Charging Availability Rate Setting</div>
            <Form.Group as={Row}>
              <Form.Label column md={2}>L2 <span data-tip data-for="tooltipId4">
                    <FontAwesomeIcon icon={faCircleQuestion} style={{ color: "#556482", marginLeft: "10px" }} />
                  </span>
                  <ReactTooltip id="tooltipId4" effect="solid" className="custom-tooltip">
                    <span>Level 2 Charging Availability Rate, between 0-1</span><br />
                  </ReactTooltip></Form.Label>

              <Col md={2}>
                <Form.Control
                  type="text"
                  pattern="^\d*(\.\d*)?$"
                  value={L2}
                  onChange={(e) => handleInputChange('L2', e.target.value)}
                  onBlur={(e) => handleBlur_2('L2', e.target.value)}
                />
                {L2Error && <div className="text-danger">{L2Error}</div>}
              </Col>
            </Form.Group>

            <Form.Group as={Row}>
              <Form.Label column md={2}>DCFC <span data-tip data-for="tooltipId5">
                    <FontAwesomeIcon icon={faCircleQuestion} style={{ color: "#556482", marginLeft: "10px" }} />
                  </span>
                  <ReactTooltip id="tooltipId5" effect="solid" className="custom-tooltip">
                    <span>Direct Current Fast Charging Availability Rate, between 0-1</span><br />
                  </ReactTooltip></Form.Label>
              <Col md={2}>
                <Form.Control
                  type="text"
                  pattern="^\d*(\.\d*)?$"
                  value={DCFC}
                  onChange={(e) => handleInputChange('DCFC', e.target.value)}
                  onBlur={(e) => handleBlur_2('DCFC', e.target.value)}
                />
                {DCFCError && <div className="text-danger">{DCFCError}</div>}
              </Col>
            </Form.Group>

            <div className="subtitle-small-five" style={{ marginTop: '50px' }}>Charging Behavior Setting</div>
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

          <div className="subtitle-small-five" style={{ marginTop: '50px' }}>Number of Simulated Vehicles</div>
            <Form.Group as={Row}>
              <Form.Label column md={2}>Number<span data-tip data-for="tooltipIdNOSV">
                    <FontAwesomeIcon icon={faCircleQuestion} style={{ color: "#556482", marginLeft: "10px" }} />
                  </span>
                  <ReactTooltip id="tooltipIdNOSV" effect="solid" className="custom-tooltip">
                    <span>Enter the number of simulated vehicles, between 10,000 to 10,000,000</span><br />
                  </ReactTooltip></Form.Label>

              <Col md={2}>
                <Form.Control
                  type="text"
                  pattern="^\d*(\.\d*)?$"
                  value={marketShare}
                  onChange={(e) => handleInputChangeNSV('NV', e.target.value)}
                  onBlur={(e) => handleBlur_2NSV('NV', e.target.value)}
                />
                {NVError && <div className="text-danger">{NVError}</div>}
              </Col>
            </Form.Group>

          <div className="subtitle-small-five" style={{ marginTop: '50px' }}>
          Day Type
          <span data-tip data-for="tooltipId1">
            <FontAwesomeIcon icon={faCircleQuestion} style={{ color: "#556482", marginLeft: "10px" }} />
          </span>
          <ReactTooltip id="tooltipId1" effect="solid" className="custom-tooltip">
            <span>Please select the date type to be simulated: weekday or weekend</span><br />
          </ReactTooltip>
          </div>
          <Form.Group as={Row} className="mb-3 justify-content-md-center" controlId="formDayType">
        <div key={`inline-radio`} className="mb-3">
          <Form.Check
            type="radio"
            label="Weekday"
            name="dayType"
            id="weekday"
            value="weekday"
            checked={dayType === 'weekday'}
            onChange={(e) => setDayType(e.target.value)}
          />
          <Form.Check
            type="radio"
            label="Weekend"
            name="dayType"
            id="weekend"
            value="weekend"
            checked={dayType === 'weekend'}
            onChange={(e) => setDayType(e.target.value)}
          />
        </div>
    </Form.Group>

          <Form.Group as={Row} className="mb-3 justify-content-md-center">
            <Col sm={2}>
              <Button className="pageBtn" type="button" onClick={() => navigate(-1)}>
                {'Back'}
              </Button>
            </Col>
            <Col md={3}>
              <Button className="pageBtn" type="submit">
                {'Get Charging Demand'}
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
            {formerrors.homePriceError && <div className="text-danger">{formerrors.homePriceError}</div>}
            {formerrors.publicPriceError && <div className="text-danger">{formerrors.publicPriceError}</div>}
            {formerrors.L2Error && <div className="text-danger">{formerrors.L2Error}</div>}
            {formerrors.DCFCError && <div className="text-danger">{formerrors.DCFCError}</div>}
            {formerrors.NVError && <div className="text-danger">{formerrors.NVError}</div>}
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  )
}

export default LiveLaunch;
