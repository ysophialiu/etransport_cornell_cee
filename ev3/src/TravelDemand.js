import React, { useState, useEffect } from "react";
import { AgChartsReact } from "ag-charts-react";
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button, Col, Row, Spinner } from "react-bootstrap";
import Header from "./Header.js";
import RedirectBack from "./RedirectBack.js";
import { db } from "./db.js";
import "./general.css";
import "./result.css";

const TravelDemand = () => {
  const { area } = useParams();
  const { state } = useLocation();
  let navigate = useNavigate();

  const [values, setValues] = useState({
    area: '',
    trip_sample: {},
    EV_sample: [],
    description: ''
  })
  const [histOptions, setHistOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { marketShare } = state;
      const found = await db.areaData.get({area: area+marketShare});
      if (found) {
        setValues(found)
      }
      else {
        const dres = await fetch(' https://etransport.cee.cornell.edu/api/areaDescription/' + area, {
          method: 'GET',
          mode: 'cors'
        });
        const description = await dres.text();
        const url = ' https://etransport.cee.cornell.edu/api/loadAreaData/' + area + '/' + marketShare
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors'
        });
        const data = await response.json();
        await db.areaData.put({
          area: area+marketShare,
          trip_sample: JSON.parse(data.trip_sample),
          EV_sample: JSON.parse(data.EV_sample),
          description
        });
        setValues({
          area: area+marketShare,
          trip_sample: JSON.parse(data.trip_sample),
          EV_sample: JSON.parse(data.EV_sample),
          description
        });
      }
    }
    fetchData().catch(console.error);
  }, []);

  useEffect(() => {
    const { trip_sample } = values

    if (Object.keys(trip_sample).length > 0) {
      const ttime = trip_sample['travel_time'];
      const ttime_array = [];
      Object.values(ttime).map((val) => ttime_array.push({'x': val}));
      var options1 = {
        data: ttime_array,
        title: {text: 'Trip travel time'},
        series: [{
          type: 'histogram',
          xKey: 'x',
          binCount: 30,
          xName: 'travel time (min)',
          showInLegend: false
        }]
      };

      const dist = trip_sample['distance'];
      const dist_array = [];
      Object.values(dist).map((val) => dist_array.push({'x': val}));
      var options2 = {
        data: dist_array,
        title: {text: 'Trip travel distance'},
        series: [{
          type: 'histogram',
          xKey: 'x',
          binCount: 30,
          xName: 'travel distance (miles)',
          showInLegend: false
        }]
      };

      const start = trip_sample['depart_period'];
      const start_array = [];
      Object.values(start).map((val) => start_array.push({'x': val/2}));
      var options3 = {
        data: start_array,
        title: {text: 'Trip start time'},
        series: [{
          type: 'histogram',
          xKey: 'x',
          binCount: 30,
          xName: 'hour in day',
          showInLegend: false
        }]
      };
      setHistOptions([options1, options2, options3])
    }
  }, [values])

  function handleChargeButton(){
    navigate("/live-model/charging-model/" + area, {
      state: {
        ...state,
        EV_sample: values.EV_sample,
        trip_sample: values.trip_sample
      }}
    )
  }

  return (!state || !state.marketShare)
  ? <RedirectBack/>
  : (<div>
      <Header/>
      <div className="big_title">BEV Travel Demand</div>
      <div className="subtitle-small">Results for {area} with {state.marketShare} vehicles assumed to be BEV</div>
      {values.area !== (area + state.marketShare)
      ? <>
          <div className="content"><Spinner animation="border" /> Loading area data...</div>
          <div className="content">This may take a minute or two, depending on how many BEVs you chose to simulate.</div>
        </>
      : values.description === "" ? <div className="content"><Spinner animation="border" /> Loading content...</div>
      : (
      <div className="content">
        <div>{values.description}</div>
        <div className="section">
          {Object.keys(values.trip_sample).length > 0 &&
            histOptions.length === 3 &&
          <div className="triple">
            <div className="images">
              <div className="image">
                <AgChartsReact options={histOptions[0]}/>
              </div>
              <div className="image">
                <AgChartsReact options={histOptions[1]}/>
              </div>
              <div className="image">
                <AgChartsReact options={histOptions[2]}/>
              </div>
            </div>
          </div>
          }

          <Row className="mb-3 justify-content-md-center">
            <Col sm={2}>
              <Button className="pageBtn" type="button" onClick={() => navigate(-1)}>
                {'< Back'}
              </Button>
            </Col>
            <Col md={3}>
              <Button className="pageBtn" type="button" onClick={handleChargeButton}>
                {'Charging Model >'}
              </Button>
            </Col>
          </Row>

        </div>
      </div>
      )}
    </div>
  )

}
export default TravelDemand;