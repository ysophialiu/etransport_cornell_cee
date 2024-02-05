import React, {useEffect} from "react";
import { useState } from "react";
import { geoCentroid } from "d3-geo";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Annotation
} from "react-simple-maps";

let allStates = [
  { "id": "AL", "val": "01", "name": "Alabama" },
  { "id": "AK", "val": "02", "name": "Alaska" },
  { "id": "AZ", "val": "04", "name": "Arizona" },
  { "id": "AR", "val": "05", "name": "Arkansas" },
  { "id": "CA", "val": "06", "name": "California" },
  { "id": "CO", "val": "08", "name": "Colorado" },
  { "id": "CT", "val": "09", "name": "Connecticut" },
  { "id": "DE", "val": "10", "name": "Delaware" },
  // { "id": "DC", "val": "11", "name": "District of Columbia" },
  { "id": "FL", "val": "12", "name": "Florida" },
  { "id": "GA", "val": "13", "name": "Georgia" },
  { "id": "HI", "val": "15", "name": "Hawaii" },
  { "id": "ID", "val": "16", "name": "Idaho" },
  { "id": "IL", "val": "17", "name": "Illinois" },
  { "id": "IN", "val": "18", "name": "Indiana" },
  { "id": "IA", "val": "19", "name": "Iowa" },
  { "id": "KS", "val": "20", "name": "Kansas" },
  { "id": "KY", "val": "21", "name": "Kentucky" },
  { "id": "LA", "val": "22", "name": "Louisiana" },
  { "id": "ME", "val": "23", "name": "Maine" },
  { "id": "MD", "val": "24", "name": "Maryland" },
  { "id": "MA", "val": "25", "name": "Massachusetts" },
  { "id": "MI", "val": "26", "name": "Michigan" },
  { "id": "MN", "val": "27", "name": "Minnesota" },
  { "id": "MS", "val": "28", "name": "Mississippi" },
  { "id": "MO", "val": "29", "name": "Missouri" },
  { "id": "MT", "val": "30", "name": "Montana" },
  { "id": "NE", "val": "31", "name": "Nebraska" },
  { "id": "NV", "val": "32", "name": "Nevada" },
  { "id": "NH", "val": "33", "name": "NewHampshire" },
  { "id": "NJ", "val": "34", "name": "NewJersey" },
  { "id": "NM", "val": "35", "name": "NewMexico" },
  { "id": "NY", "val": "36", "name": "NewYork" },
  { "id": "NC", "val": "37", "name": "NorthCarolina" },
  { "id": "ND", "val": "38", "name": "NorthDakota" },
  { "id": "OH", "val": "39", "name": "Ohio" },
  { "id": "OK", "val": "40", "name": "Oklahoma" },
  { "id": "OR", "val": "41", "name": "Oregon" },
  { "id": "PA", "val": "42", "name": "Pennsylvania" },
  { "id": "RI", "val": "44", "name": "RhodeIsland" },
  { "id": "SC", "val": "45", "name": "SouthCarolina" },
  { "id": "SD", "val": "46", "name": "SouthDakota" },
  { "id": "TN", "val": "47", "name": "Tennessee" },
  { "id": "TX", "val": "48", "name": "Texas" },
  { "id": "UT", "val": "49", "name": "Utah" },
  { "id": "VT", "val": "50", "name": "Vermont" },
  { "id": "VA", "val": "51", "name": "Virginia" },
  { "id": "WA", "val": "53", "name": "Washington" },
  { "id": "WV", "val": "54", "name": "WestVirginia" },
  { "id": "WI", "val": "55", "name": "Wisconsin" },
  { "id": "WY", "val": "56", "name": "Wyoming" }
];

const geoUrl = "/usMap.json";

const offsets = {
  VT: [50, -8],
  NH: [34, 2],
  MA: [30, -1],
  RI: [28, 2],
  CT: [35, 10],
  NJ: [34, 1],
  DE: [33, 0],
  MD: [47, 10],
  DC: [49, 21]
};

const MapChart = ({ onStateClick, selectedState: externalSelectedState }) => {
  const [internalSelectedState, setInternalSelectedState] = useState(null);

  useEffect(() => {
    const state = allStates.find(s => s.name === externalSelectedState);
    if (state) {
      setInternalSelectedState(state);
    }
  }, [externalSelectedState]);

  return (
    <div className="map-container">
      <ComposableMap projection="geoAlbersUsa">
        <Geographies geography={geoUrl}>
          {({ geographies }) => (
            <>
              {geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  stroke="#FFF"
                  geography={geo}
                  fill={
                    (() => {
                      return internalSelectedState && internalSelectedState.val === geo.id ? "#e53935" : "#DDD";
                    })()
                  }
                  onClick={() => {
                    const cur = allStates.find(s => s.val === geo.id);
                    if (cur) {
                      setInternalSelectedState(cur);
                      if (onStateClick) onStateClick(cur.name);
                    }
                  }}
                />
              ))}
              {geographies.map(geo => {
                const centroid = geoCentroid(geo);
                const cur = allStates.find(s => s.val === geo.id);
                return (
                  <g key={geo.rsmKey + "-name"}>
                    {cur &&
                      centroid[0] > -160 &&
                      centroid[0] < -67 &&
                      (Object.keys(offsets).indexOf(cur.id) === -1 ? (
                        <Marker coordinates={centroid}>
                          <text y="2" fontSize={14} textAnchor="middle">
                            {cur.id}
                          </text>
                        </Marker>
                      ) : (
                        <Annotation
                          subject={centroid}
                          dx={offsets[cur.id][0]}
                          dy={offsets[cur.id][1]}
                        >
                          <text x={4} fontSize={14} alignmentBaseline="middle">
                            {cur.id}
                          </text>
                        </Annotation>
                      ))}
                  </g>
                );
              })}
            </>
          )}
        </Geographies>
      </ComposableMap>
    </div>
  );
};


export default MapChart;