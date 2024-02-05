import React, {forwardRef, useEffect, useRef, useImperativeHandle} from "react";
import { useState } from "react";
import { geoCentroid } from "d3-geo";
import { scaleQuantile } from "d3-scale";
import { schemeBlues, select } from "d3";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Annotation,
  ZoomableGroup
} from "react-simple-maps";

let allStates = [
  { "id": "AL", "fips": "01", "scale": 5000, "offset": [-86.7,32.7], "name": "Alabama" },
  { "id": "AK", "fips": "02", "scale": 700, "offset": [-154.3,63.2], "name": "Alaska" },
  { "id": "AZ", "fips": "04", "scale": 4700, "offset": [-112,34.2], "name": "Arizona" },
  { "id": "AR", "fips": "05", "scale": 5700, "offset": [-92.3,34.6], "name": "Arkansas" },
  { "id": "CA", "fips": "06", "scale": 2100, "offset": [-119.6,37], "name": "California" },
  { "id": "CO", "fips": "08", "scale": 5000, "offset": [-105.5,38.8], "name": "Colorado" },
  { "id": "CT", "fips": "09", "scale": 14000, "offset": [-72.8,41.4], "name": "Connecticut" },
  { "id": "DE", "fips": "10", "scale": 15000, "offset": [-75.4,39.1], "name": "Delaware" },
  { "id": "FL", "fips": "12", "scale": 4400, "offset": [-83.4,27.7], "name": "Florida" },
  { "id": "GA", "fips": "13", "scale": 5000, "offset": [-83.4,32.5], "name": "Georgia" },
  { "id": "HI", "fips": "15", "scale": 6000, "offset": [-157.4,20.4], "name": "Hawaii" },
  { "id": "ID", "fips": "16", "scale": 3000, "offset": [-114.7,45.6], "name": "Idaho" },
  { "id": "IL", "fips": "17", "scale": 4600, "offset": [-89.2,39.8], "name": "Illinois" },
  { "id": "IN", "fips": "18", "scale": 5000, "offset": [-86.4,39.9], "name": "Indiana" },
  { "id": "IA", "fips": "19", "scale": 5000, "offset": [-93.5,41.8], "name": "Iowa" },
  { "id": "KS", "fips": "20", "scale": 5000, "offset": [-98.5,38.3], "name": "Kansas" },
  { "id": "KY", "fips": "21", "scale": 5000, "offset": [-85.6,37.2], "name": "Kentucky" },
  { "id": "LA", "fips": "22", "scale": 5000, "offset": [-92.2,30.9], "name": "Louisiana" },
  { "id": "ME", "fips": "23", "scale": 5000, "offset": [-69.1,45.2], "name": "Maine" },
  { "id": "MD", "fips": "24", "scale": 8000, "offset": [-77.5,38.7], "name": "Maryland" },
  { "id": "MA", "fips": "25", "scale": 10000, "offset": [-72.0,42.3], "name": "Massachusetts" },
  { "id": "MI", "fips": "26", "scale": 3000, "offset": [-85.6,44.6], "name": "Michigan" },
  { "id": "MN", "fips": "27", "scale": 3800, "offset": [-94.3,46.5], "name": "Minnesota" },
  { "id": "MS", "fips": "28", "scale": 5000, "offset": [-89.4,32.6], "name": "Mississippi" },
  { "id": "MO", "fips": "29", "scale": 5000, "offset": [-92.5,38.1], "name": "Missouri" },
  { "id": "MT", "fips": "30", "scale": 3700, "offset": [-110, 47], "name": "Montana" },
  { "id": "NE", "fips": "31", "scale": 4800, "offset": [-99.7, 41.3], "name": "Nebraska" },
  { "id": "NV", "fips": "32", "scale": 3600, "offset": [-116.7, 38.6], "name": "Nevada" },
  { "id": "NH", "fips": "33", "scale": 8000, "offset": [-71.5, 43.9], "name": "NewHampshire" },
  { "id": "NJ", "fips": "34", "scale": 9500, "offset": [-74.7, 40.1], "name": "NewJersey" },
  { "id": "NM", "fips": "35", "scale": 4800, "offset": [-106, 34.2], "name": "NewMexico" },
  { "id": "NY", "fips": "36", "scale": 5000, "offset": [-76.1, 42.8], "name": "NewYork" },
  { "id": "NC", "fips": "37", "scale": 5000, "offset": [-79.8, 35.3], "name": "NorthCarolina" },
  { "id": "ND", "fips": "38", "scale": 5000, "offset": [-100.3, 47.5], "name": "NorthDakota" },
  { "id": "OH", "fips": "39", "scale": 6500, "offset": [-82.6, 40.4], "name": "Ohio" },
  { "id": "OK", "fips": "40", "scale": 5000, "offset": [-98.6, 35.5], "name": "Oklahoma" },
  { "id": "OR", "fips": "41", "scale": 5000, "offset": [-120.7, 44.1], "name": "Oregon" },
  { "id": "PA", "fips": "42", "scale": 7500, "offset": [-77.7, 41], "name": "Pennsylvania" },
  { "id": "RI", "fips": "44", "scale": 25000, "offset": [-71.5, 41.55], "name": "RhodeIsland" },
  { "id": "SC", "fips": "45", "scale": 7000, "offset": [-81.2, 33.6], "name": "SouthCarolina" },
  { "id": "SD", "fips": "46", "scale": 5000, "offset": [-100.2, 44.2], "name": "SouthDakota" },
  { "id": "TN", "fips": "47", "scale": 5000, "offset": [-86, 35.7], "name": "Tennessee" },
  { "id": "TX", "fips": "48", "scale": 2500, "offset": [-100, 31.3], "name": "Texas" },
  { "id": "UT", "fips": "49", "scale": 5000, "offset": [-111.9, 39.5], "name": "Utah" },
  { "id": "VT", "fips": "50", "scale": 8700, "offset": [-72.7, 43.9], "name": "Vermont" },
  { "id": "VA", "fips": "51", "scale": 5000, "offset": [-79.4, 37.7], "name": "Virginia" },
  { "id": "WA", "fips": "53", "scale": 5000, "offset": [-120.8, 47.3], "name": "Washington" },
  { "id": "WV", "fips": "54", "scale": 7300, "offset": [-80.4, 38.9], "name": "WestVirginia" },
  { "id": "WI", "fips": "55", "scale": 4700, "offset": [-89.5, 44.9], "name": "Wisconsin" },
  { "id": "WY", "fips": "56", "scale": 5000, "offset": [-107.7, 43], "name": "Wyoming" }
];


const StateChart = (props, ref) => {

  const mapContainer = useRef(null);

  /*useEffect(() => {
    if(mapContainer.current){
      // reset map position
      // setZoom(1);
      // setCenter(stateMetadata.offset);
    }
  }, [zoom, center, mapContainer.current]);*/

  const [stateMetadata, setStateMetadata] = useState(allStates.find(s => s.name === props.state_name));
  const [dataScale, setDataScale] = useState(props.datascale);
  console.log(dataScale);

  const charges = props.chargedata.charges;
  let scaled_charges = {};
  Object.keys(charges).forEach((geoid) => {scaled_charges[geoid] = charges[geoid]*dataScale});


  let colorScale = scaleQuantile().domain(Object.values(scaled_charges)).range(schemeBlues[5]);

  let geographyURL = '/shapes/' + props.state_name + '_shape.topojson';

  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState(stateMetadata.offset);

  const resetZoom = () => {
    setZoom(1);
    setCenter(stateMetadata.offset);
  }

  useImperativeHandle(ref, () => {
    return {
      publicResetZoom() {
        resetZoom();
      }
    }
  })

  return (
    <div>
      <div className="print-map-container" style={{display:"none"}}>
        <ComposableMap projection="geoMercator"
          projectionConfig={{
            "center": stateMetadata.offset,
            "scale": stateMetadata.scale,
          }}
        >
          <Geographies geography={"/topo/tl_2015_" + stateMetadata.fips + "_tract.json"} style={{}}>
            {({ geographies }) =>
              geographies.map((geography) => {
                const t = scaled_charges[geography.properties.GEOID];
                return (
                  <Geography
                      key={geography.rsmKey}
                      geography={geography}
                      fill={t !== undefined ? colorScale(t) : '#ffcbc9'}
                  />
                );
              })
            }
          </Geographies>
          <g className="legendEntry" data={colorScale.range().reverse()}>
            <rect x={0} y={0} width={200} height={210} fillOpacity={0.2} />
            <rect x={20} y={20} width={10} height={10} style={{"stroke":"black","strokeWidth":1,fill:schemeBlues[5][0]}} />
            <rect x={20} y={50} width={10} height={10} style={{"stroke":"black","strokeWidth":1,fill:schemeBlues[5][1]}} />
            <rect x={20} y={80} width={10} height={10} style={{"stroke":"black","strokeWidth":1,fill:schemeBlues[5][2]}} />
            <rect x={20} y={110} width={10} height={10} style={{"stroke":"black","strokeWidth":1,fill:schemeBlues[5][3]}} />
            <rect x={20} y={140} width={10} height={10} style={{"stroke":"black","strokeWidth":1,fill:schemeBlues[5][4]}} />
            <rect x={20} y={170} width={10} height={10} style={{"stroke":"black","strokeWidth":1,fill:"#ffcbc9"}} />
            <text x={35} y={18} dy={"0.8em"}>{'0 - ' + Math.round(colorScale.quantiles()[0]) + ' kW/h'}</text>
            <text x={35} y={48} dy={"0.8em"}>{Math.round(colorScale.quantiles()[0]) + ' - ' + Math.round(colorScale.quantiles()[1]) + ' kW/h'}</text>
            <text x={35} y={78} dy={"0.8em"}>{Math.round(colorScale.quantiles()[1]) + ' - ' + Math.round(colorScale.quantiles()[2]) + ' kW/h'}</text>
            <text x={35} y={108} dy={"0.8em"}>{Math.round(colorScale.quantiles()[2]) + ' - ' + Math.round(colorScale.quantiles()[3]) + ' kW/h'}</text>
            <text x={35} y={138} dy={"0.8em"}>{'>' + Math.round(colorScale.quantiles()[3]) + ' kW/h'}</text>
            <text x={35} y={168} dy={"0.8em"}>No Data</text>
          </g>
        </ComposableMap>
      </div>
      <div style={{border:"2px solid gray", marginBotton:"20px"}} ref={mapContainer}>
        <ComposableMap projection="geoMercator"
          projectionConfig={{
            "center": stateMetadata.offset,
            "scale": stateMetadata.scale,
          }}
        >
          <ZoomableGroup center={center} zoom={zoom}>
          <Geographies geography={"/topo/tl_2015_" + stateMetadata.fips + "_tract.json"}>
            {({ geographies }) =>
              geographies.map((geography) => {
                const t = scaled_charges[geography.properties.GEOID];
                return (
                  <Geography
                      key={geography.rsmKey}
                      geography={geography}
                      fill={t !== undefined ? colorScale(t) : '#ffcbc9'}
                  />
                );
              })
            }
          </Geographies>
          </ZoomableGroup>
          <g className="legendEntry" data={colorScale.range().reverse()}>
            <rect x={0} y={0} width={200} height={210} fillOpacity={0.2} />
            <rect x={20} y={20} width={10} height={10} style={{"stroke":"black","strokeWidth":1,fill:schemeBlues[5][0]}} />
            <rect x={20} y={50} width={10} height={10} style={{"stroke":"black","strokeWidth":1,fill:schemeBlues[5][1]}} />
            <rect x={20} y={80} width={10} height={10} style={{"stroke":"black","strokeWidth":1,fill:schemeBlues[5][2]}} />
            <rect x={20} y={110} width={10} height={10} style={{"stroke":"black","strokeWidth":1,fill:schemeBlues[5][3]}} />
            <rect x={20} y={140} width={10} height={10} style={{"stroke":"black","strokeWidth":1,fill:schemeBlues[5][4]}} />
            <rect x={20} y={170} width={10} height={10} style={{"stroke":"black","strokeWidth":1,fill:"#ffcbc9"}} />
            <text x={35} y={18} dy={"0.8em"}>{'0 - ' + Math.round(colorScale.quantiles()[0]) + ' kW/h'}</text>
            <text x={35} y={48} dy={"0.8em"}>{Math.round(colorScale.quantiles()[0]) + ' - ' + Math.round(colorScale.quantiles()[1]) + ' kW/h'}</text>
            <text x={35} y={78} dy={"0.8em"}>{Math.round(colorScale.quantiles()[1]) + ' - ' + Math.round(colorScale.quantiles()[2]) + ' kW/h'}</text>
            <text x={35} y={108} dy={"0.8em"}>{Math.round(colorScale.quantiles()[2]) + ' - ' + Math.round(colorScale.quantiles()[3]) + ' kW/h'}</text>
            <text x={35} y={138} dy={"0.8em"}>{'>' + Math.round(colorScale.quantiles()[3]) + ' kW/h'}</text>
            <text x={35} y={168} dy={"0.8em"}>No Data</text>
          </g>
        </ComposableMap>
        <button className="ZoomBtn" onClick={() => setZoom(prev => prev + 0.1)}>
          +
        </button>
        <button className="ZoomBtn" onClick={() => setZoom(prev => prev - 0.1)}>
          -
        </button>
        <button className="ZoomBtn" onClick={resetZoom}>
          Reset
        </button>
      </div>
    </div>
  );
};


export default forwardRef(StateChart);