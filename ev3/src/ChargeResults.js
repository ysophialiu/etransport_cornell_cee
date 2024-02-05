import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from 'axios'
import { AgChartsReact } from "ag-charts-react";
import { Col, Row, Spinner } from "react-bootstrap";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleSqrt } from "d3-scale";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Label } from 'recharts';
import geodata from './Model_Traffic_Analysis_Zones_20201.json';
import Header from "./Header";
import RedirectBack from "./RedirectBack";
import { db } from "./db.js";

const ChargeResults = () => {
  const { area } = useParams()
  const [status, setStatus] = useState('loading');
  const [colorScale, setColorScale] = useState(() => x => "#EEE");
  const [values, setValues] = useState({})

  const [data0, setData0] = useState([])
  const [data1, setData1] = useState([])
  const [data2, setData2] = useState([])
  const [data3, setData3] = useState([])

  const [county, setCounty] = useState([])

  const { state } = useLocation();

  useEffect(() => {
    fetch('https://etransport.cee.cornell.edu/api/' + area).then(res => res.json()).then(data => setCounty(data)).catch(err => console.log(err))
  }, [area])

  useEffect(() => {
    if (!state || Object.keys(state).length !== 7) {
      return <RedirectBack/>;
    }

    const fetchData = async () => {
      const { marketShare, BEVgroupShares, riskSensitivity, willingnessToPay, rangeBuffer } = state
      const params = area + marketShare + BEVgroupShares.toString() + riskSensitivity + willingnessToPay + rangeBuffer
      const found = await db.results.get({params: params});
      if (found) {
        setValues(found)
      } else {
        setStatus('running');
        const response = await fetch(' https://etransport.cee.cornell.edu/api/runsimulationmodel', {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify(state),
          headers: { 'Content-type': 'application/json' }
        });
        const data = await response.json();
        await db.results.put({
          params,
          time: data.time,
          ind_res: JSON.parse(data.ind_res),
          E_taz: JSON.parse(data.E_taz),
          E_use: data.E_use,
          labels: data.labels,
          sizes: data.sizes,
          L_type: data.L_type,
          E_use_h2: data.E_use_h2,
          E_use_l2: data.E_use_l2,
          E_use_l3: data.E_use_l3
        });
        setValues({
          params,
          time: data.time,
          ind_res: JSON.parse(data.ind_res),
          E_taz: JSON.parse(data.E_taz),
          E_use: data.E_use,
          labels: data.labels,
          sizes: data.sizes,
          L_type: data.L_type,
          E_use_h2: data.E_use_h2,
          E_use_l2: data.E_use_l2,
          E_use_l3: data.E_use_l3
        });
      }
    }
    fetchData().catch(err => console.log(err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Object.keys(values).length === 0) return
    const { labels, sizes, E_use, L_type } = values

    console.log(values)

    setColorScale(() => scaleSqrt()
        // .domain([-2,1]) //, Math.max(E_use.map(d => d['total energy']))])
        .range(['#ffe6e6','#ffdad9','#ffcdcc','#ffc0be','#ffb4b0','#ffa7a1',
          '#ff9a92','#ff8c83','#ff7f73','#ff7163','#ff6253','#ff5242','#ff4131',
          '#ff2b1d','#ff0000'])
        // .exponent(.33)
      );

    const tot = sizes[0]+sizes[1]+sizes[2]+sizes[3]+sizes[4]
    const d = [
      {'label': labels[0], 'value': sizes[0]/tot},
      {'label': labels[1], 'value': sizes[1]/tot},
      {'label': labels[2], 'value': sizes[2]/tot},
      {'label': labels[3], 'value': sizes[3]/tot},
      {'label': labels[4], 'value': sizes[4]/tot},
    ]
    setData0(d);

    const d2 = Object.keys(L_type["1"]["home"]).map((i, index) => {
      return {'x': parseFloat(i)/2, 'y': Object.values(L_type["1"]["home"])[index]*3.6/1000}
    })
    setData1(d2);

    const d3 = Object.keys(L_type["2"]["work"]).map((i, index) => {
      return {'x': parseFloat(i)/2, 'y': Object.values(L_type["2"]["work"])[index]*6.2/1000, 'z': Object.values(L_type["2"]["public"])[index]*6.2/1000}
    })
    setData2(d3);

    const d4 = Object.keys(L_type["3"]["work"]).map((i, index) => {
      return {'x': parseFloat(i)/2, 'y': Object.values(L_type["3"]["work"])[index]*150/1000, 'z': Object.values(L_type["3"]["public"])[index]*150/1000}
    })
    setData3(d4);

    setStatus('ready')

  }, [values])

  function countyLayer(county, width) {
    return <Geographies geography={county}>
            {({ geographies }) =>
              geographies.map(geo => {
                return <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  stroke="black"
                  strokeWidth={width}
                  fill="none"
                  className="focus:outline-none"/>   
              })}
            </Geographies> 
  }

  function mapLayer(valuesField) {
    return <Geographies geography={geodata}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const d = valuesField[geo.properties.MTAZ10-1];
                  return <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill = {d ? colorScale(d['total energy']) : "#EEE"}
                    stroke="white"
                    strokeWidth="0.01"
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none" },
                      pressed: { outline: "none" },
                      focus: { outline: "none" }
                    }}
                  />
              })}
            </Geographies>
  }

  function pprint (type, value) {
    switch (type) {
      case 'risk': return value.substring(5) + ' risk sensitivity'
      case 'willingness': return value.substring(12) + ' charging rate preference'
      case 'buffer': return value.substring(7) + '% range buffer'
      default: return ''
    }
  }

  return (
    <div>
      <Header/>
      <div className="big_title">BEV Charging Demand</div>
      <div className="subtitle-small">
      Results for {area} with {pprint('risk', state.riskSensitivity)}, {pprint('willingness', state.willingnessToPay)}, and {pprint('buffer', state.rangeBuffer)} 
      </div>
      <div className="content">
        {status === 'loading' ? <div><Spinner animation="border"/> Loading...</div>
        : status === 'running' ? <div><Spinner animation="border"/> Simulation is running...</div>
        : (<>
        <div className="section">
          {values.E_use.length > 0 && data0.length > 0 &&
          <Row>
            <Col className="text-center">
              <div className="subtitle-small-three">Spatial distribution of energy demand in a 24-hour period</div>
              {values.E_use.length > 0 &&
              <ComposableMap width={45} height={27} projection='geoTransverseMercator' projectionConfig={{scale: 1000, rotate: [83.388, 0, 0], center: [-.9, 33.849]}}>
                <Geographies geography={geodata}>
                    {({ geographies }) => (
                      <>
                      {geographies.map(geo => {
                        
                        const d = values.E_use[geo.properties.MTAZ10-1];
                        return <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill = {d ? colorScale(d['total energy']) : "#EEE"}
                          stroke="white"
                          strokeWidth="0.01"
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none" },
                            pressed: { outline: "none" },
                            focus: { outline: "none" }
                          }}
                        />
                    })}
                  </>)}
                </Geographies>
                {countyLayer(county, "0.03")}              
              </ComposableMap>}
            </Col>
            <Col className="text-center">
              <div className="subtitle-small-three">Percentage of energy demand by locations and charging modes</div>
              <AgChartsReact options={{
                data: data0,
                series: [{
                  type: 'pie',
                  angleKey: 'value',
                  labelKey: 'label',
                  callout: {
                    length: 16
                  }
                }],
                autoSize: false,
                padding: {
                    bottom: 40,
                    right: 0,
                    top: 10
                },
                legend: {
                  position: 'bottom'
                }
              }}/>
            </Col>
          </Row>
          }
        </div>

        <div className="section">
        <div className="subtitle-small-two">Temporal distribution of charging demand in a 24-hour period by locations and charging modes</div>
          {data1.length > 0 && data2.length > 0 && data3.length > 0 &&
          <Row>
            <Col className="text-center">
              <span>Residential area, level 2</span>
              <LineChart width={350} height={250} data={data1}
                margin={{ top: 10, right: 5, left: 5, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" tick={{fontSize: 12}}>
                  <Label value='Hour in day' offset={-8} position='insideBottom' style={{fontSize: 13}}/>
                </XAxis>
                <YAxis tick={{fontSize: 12}}>
                  <Label value='Power demand (MW)' position= 'left' angle={-90} offset={-15} style={{textAnchor: "middle", fontSize: 13}}/>
                </YAxis>
                <Tooltip />
                <Legend layout='horizontal' verticalAlign="top" wrapperStyle={{fontSize: 13}}/>
                <Line type="monotone" dataKey="y" stroke="#8884d8" dot={false} name='Home L2'/>
              </LineChart>
            </Col>

            <Col className="text-center">
              <span>Non-residential area, level 2</span>
              <LineChart width={350} height={250} data={data2}
                margin={{ top: 10, right: 5, left: 5, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" tick={{fontSize: 12}}>
                  <Label value='Hour in day' offset={-8} position='insideBottom' style={{fontSize: 13}}/>
                </XAxis>
                <YAxis tick={{fontSize: 12}}>
                  <Label value='Power demand (MW)' position= 'left' angle={-90} offset={-15} style={{textAnchor: "middle", fontSize: 13}}/>
                </YAxis>
                <Tooltip />
                <Legend layout='horizontal' verticalAlign="top" wrapperStyle={{fontSize: 13}}/>
                <Line type="monotone" dataKey="y" stroke="#8884d8" dot={false} name='Work L2'/>
                <Line type="monotone" dataKey="z" stroke="#82ca9d" dot={false} name='Public L2'/>
              </LineChart>
            </Col>

            <Col className="text-center">
              <span>Non-residential area, DCFC</span>
              <LineChart width={350} height={250} data={data3}
                margin={{ top: 10, right: 5, left: 5, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" tick={{fontSize: 12}}>
                  <Label value='Hour in day' offset={-8} position='insideBottom' style={{fontSize: 13}}/>
                </XAxis>
                <YAxis tick={{fontSize: 12}}>
                  <Label value='Power demand (MW)' position= 'left' angle={-90} offset={-15} style={{textAnchor: "middle", fontSize: 13}}/>
                </YAxis>
                <Tooltip />
                <Legend layout='horizontal' verticalAlign="top" wrapperStyle={{fontSize: 13}}/>
                <Line type="monotone" dataKey="y" stroke="#8884d8" dot={false} name='Work DCFC'/>
                <Line type="monotone" dataKey="z" stroke="#82ca9d" dot={false} name='Public DCFC'/>
              </LineChart>
            </Col>
          </Row>}
        </div>
          
        <div className="section">
        <div className="subtitle-small-two">Spatial distribution of charging demand in a 24-hour period by locations and charging modes</div>
            {values.E_use_h2.length > 0 && values.E_use_l2.length > 0 && values.E_use_l3.length > 0 && 
          <Row>
            <Col className="text-center">
              {values.E_use_h2.length > 0 && <>
              <ComposableMap width={35} height={29} projection='geoTransverseMercator' projectionConfig={{scale: 1000, rotate: [83.388, 0, 0], center: [-.9, 33.849]}}>
                {mapLayer(values.E_use_h2)}
                {countyLayer(county, "0.02")}
              </ComposableMap>
              <span>Residential area, level 2</span>
              </>}
            </Col>
            <Col className="text-center">
              {values.E_use_l2.length > 0 && <>
              <ComposableMap width={35} height={29} projection='geoTransverseMercator' projectionConfig={{scale: 1000, rotate: [83.388, 0, 0], center: [-.9, 33.849]}}>
                {mapLayer(values.E_use_l2)}
                {countyLayer(county, "0.02")}
              </ComposableMap>
              <span>Non-residential area, level 2</span>
              </>}
            </Col>
            <Col className="text-center">
              {values.E_use_l3.length > 0 && <>
              <ComposableMap width={35} height={29} projection='geoTransverseMercator' projectionConfig={{scale: 1000, rotate: [83.388, 0, 0], center: [-.9, 33.849]}}>
                {mapLayer(values.E_use_l3)}
                {countyLayer(county, "0.02")}
              </ComposableMap>
              <span>Non-residential area, DCFC</span>
              </>}
            </Col>
          </Row>}
        </div>

        </>)}
      </div>
    </div>
  )
}

export default ChargeResults;