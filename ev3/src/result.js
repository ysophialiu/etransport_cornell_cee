import React, { useEffect, useState } from "react";
import Header from "./Header.js";
import "./general.css";
import "./result.css";
import Select from "react-select";
import Slider, { SliderTooltip } from "rc-slider";
import "rc-slider/assets/index.css";
import { useNavigate } from "react-router-dom";

const Result = () => {

  function NavigateButton({ children }) {
    const navigate = useNavigate();
    return children(navigate);
  }

  const userBehaviorOptions = [
    { value: "HighRiskSensitive", label: "High Risk Sensetive" },
    { value: "MediumRiskSensitive", label: "Medium Risk Sensitive" },
    { value: "LowRiskSensitive", label: "Low Risk Sensitive" },
    {
      value: "WillingnessToPayChargingRate",
      label: "Willingness to Pay for higher Charging Rate",
    },
    {
      value: "WillingnessToAcceptChargingRate",
      label: "Willingness to Accept higher Charging Rate",
    },
  ];

  const chargingModeOptions = [
    { value: "Home", label: "Home Level 2" },
    { value: "NotHomeDCFC", label: "Work/Public DCFC" },
    { value: "NotHomeSlow", label: "Work/Public Level 2" },
  ];

  const [optionsState, setOptionsState] = useState({
    metro_value: "Atlanta",
    share_value: "10",
    user_behavior: {
      value: "LowRiskSensitive",
      label: "Low Risk Sensitive",
    },
    start_time: "0",
    charging_mode: { value: "Home", label: "Home Level 2" },
  });

  const handleUserBehaviorChange = (user_behavior) => {
    setOptionsState({ user_behavior });
  };

  const handleStartTimeChange = (value) => {
    setOptionsState({ start_time: value });
  };

  const handleChargingModeChange = (charging_mode) => {
    setOptionsState({ charging_mode });
  };

  const { metro_value, share_value, start_time } = optionsState;

  const { Handle } = Slider;
  const handle = (props) => {
    const { value, dragging, index, ...restProps } = props;
    return (
      <SliderTooltip
        prefixCls="rc-slider-tooltip"
        overlay={`${value}:00`}
        visible={dragging}
        placement="top"
        key={index}
      >
        <Handle value={value} {...restProps} />
      </SliderTooltip>
    );
  };

  const [img_links, set_img_links] = useState({
    travel_demand_time_src: "",
    travel_demand_distance_src: "",
    travel_demand_start_src: "",
    travel_demand_number_src: "",
    charging_demand_energy_total_src: "",
    charging_demand_energy_percent_src: "",
    charging_demand_power_home_src: "",
    charging_demand_power_not_home_slow_src: "",
    charging_demand_power_not_home_fast_src: "",
    charging_demand_energy_home_src: "",
    charging_demand_energy_not_home_slow_src: "",
    charging_demand_energy_not_home_fast_src: "",
    charging_demand_specific_src: ""
  });

  const getFromAPI = async (url) => {
    const img_url = URL.createObjectURL(await (await fetch(url)).blob());
    return img_url;
  }
  const user_behavior = optionsState.user_behavior.value;
  const charging_mode = optionsState.charging_mode.value;
  // URLs for all the pictures
  const base = 'http://172.20.0.3:5000/api';
  const travel_demand_time_src = base + `/travel_demand/TripTravelTime/${metro_value}/${share_value}`;
  const travel_demand_distance_src = base + `/travel_demand/TripTravelDistance/${metro_value}/${share_value}`;
  const travel_demand_start_src = base + `/travel_demand/TripStartTime/${metro_value}/${share_value}`;
  const travel_demand_number_src = base + `/travel_demand/NumberOfTrip/${metro_value}/${share_value}`;
  const charging_demand_energy_total_src = base + `/charging_demand/EnergyTotal/${metro_value}/${share_value}/${user_behavior}`;
  const charging_demand_energy_percent_src = base + `/charging_demand/EnergyPercent/${metro_value}/${share_value}/${user_behavior}`;
  const charging_demand_power_home_src = base + `/charging_demand/PowerAllHome/${metro_value}/${share_value}/${user_behavior}`;
  const charging_demand_power_not_home_slow_src = base + `/charging_demand/PowerAllNotHomeSlow/${metro_value}/${share_value}/${user_behavior}`;
  const charging_demand_power_not_home_fast_src = base + `/charging_demand/PowerAllNotHomeDCFC/${metro_value}/${share_value}/${user_behavior}`;
  const charging_demand_energy_home_src = base + `/charging_demand/EnergyHome/${metro_value}/${share_value}/${user_behavior}`;
  const charging_demand_energy_not_home_slow_src = base + `/charging_demand/EnergyNotHomeSlow/${metro_value}/${share_value}/${user_behavior}`;
  const charging_demand_energy_not_home_fast_src = base + `/charging_demand/EnergyNotHomeDCFC/${metro_value}/${share_value}/${user_behavior}`;
  const charging_demand_specific_src = base + `/charging_demand_specific/${metro_value}/${share_value}/${user_behavior}/${charging_mode}/${start_time}`;

  useEffect(() => {
    const getData = async () => {
      const travel_demand_time_src_img = await getFromAPI(travel_demand_time_src)
      const travel_demand_distance_src_img = await getFromAPI(travel_demand_distance_src)
      const travel_demand_start_src_img = await getFromAPI(travel_demand_start_src)
      const travel_demand_number_src_img = await getFromAPI(travel_demand_number_src)
      const charging_demand_energy_total_src_img = await getFromAPI(charging_demand_energy_total_src)
      const charging_demand_energy_percent_src_img = await getFromAPI(charging_demand_energy_percent_src)
      const charging_demand_power_home_src_img = await getFromAPI(charging_demand_power_home_src)
      const charging_demand_power_not_home_slow_src_img = await getFromAPI(charging_demand_power_not_home_slow_src)
      const charging_demand_power_not_home_fast_src_img = await getFromAPI(charging_demand_power_not_home_fast_src)
      const charging_demand_energy_home_src_img = await getFromAPI(charging_demand_energy_home_src)
      const charging_demand_energy_not_home_slow_src_img = await getFromAPI(charging_demand_energy_not_home_slow_src)
      const charging_demand_energy_not_home_fast_src_img = await getFromAPI(charging_demand_energy_not_home_fast_src)
      const charging_demand_specific_src_img = await getFromAPI(charging_demand_specific_src)
      set_img_links({
        travel_demand_time_src: travel_demand_time_src_img,
        travel_demand_distance_src: travel_demand_distance_src_img,
        travel_demand_start_src: travel_demand_start_src_img,
        travel_demand_number_src: travel_demand_number_src_img,
        charging_demand_energy_total_src: charging_demand_energy_total_src_img,
        charging_demand_energy_percent_src: charging_demand_energy_percent_src_img,
        charging_demand_power_home_src: charging_demand_power_home_src_img,
        charging_demand_power_not_home_slow_src: charging_demand_power_not_home_slow_src_img,
        charging_demand_power_not_home_fast_src: charging_demand_power_not_home_fast_src_img,
        charging_demand_energy_home_src: charging_demand_energy_home_src_img,
        charging_demand_energy_not_home_slow_src: charging_demand_energy_not_home_slow_src_img,
        charging_demand_energy_not_home_fast_src: charging_demand_energy_not_home_fast_src_img,
        charging_demand_specific_src: charging_demand_specific_src_img
      });
    }
    getData();
  }, [travel_demand_time_src, travel_demand_distance_src, travel_demand_start_src,
    travel_demand_number_src, charging_demand_energy_total_src, charging_demand_energy_percent_src,
    charging_demand_power_home_src, charging_demand_power_not_home_slow_src,
    charging_demand_power_not_home_fast_src, charging_demand_energy_home_src,
    charging_demand_energy_not_home_slow_src, charging_demand_energy_not_home_fast_src, charging_demand_specific_src]);
  return (
    <div>
      <Header />
      <div className="big_title">{metro_value} Metropolitan Area</div>

      <div className="content">
        {/*TODO: All the text should be passed from back-end. 
            When user select different settings, the text should 
            be different. */}
        <div>
          Atlanta Metropolitan area, located in Georgia, U.S. is
          the third-largest metropolitan region in the southeastern
          U.S. and the fourth-fastest-growing metropolitan area in the
          U.S. The area contains 21 counties and 5922 Traffic analytic
          zones (TAZs). For more information about the region, please visit
          the <a href="https://atlantaregional.org">Atlanta Regional Commission (ARC)</a>.
        </div>
        <div className="section">
          <div className="subtitle">
            BEV travel demand
          </div>
          <div>
            Individual trip data for the year 2030 were simulated by the
            Atlanta Regional Commission (ARC), which contains 4.9 million
            vehicles and 21.3 million typical commuting trips. In this
            analysis, {share_value}% of the vehicles are assumed to be BEV.
          </div>

          <div className="single_image">
            <img
              src={img_links[travel_demand_number_src]}
              alt="Number of trips end at each traffic analytic zone"
            />
            <div>Counties and number of trips that end in each TAZ in the Atlanta metropolitan area</div>
          </div>
          <div>
            98% of trips start in the daytime between 6:00 and 22:00,
            with three morning, midday, and afternoon peaks of travel demand.
            Most of the trips last less than one hour and the average travel
            time is 20 min. The travel distance is less than 100 miles with an average of 7 miles.
          </div>

          <div className="triple">
            <div className="images">
              <div className="image">
                <img
                  src={img_links[travel_demand_time_src]}
                  alt="Trip travel time"
                />
                <div>Trip travel time</div>
              </div>

              <div className="image">
                <img
                  src={img_links[travel_demand_distance_src]}
                  alt="Trip travel distance"
                />
                <div>Trip travel distance</div>
              </div>

              <div className="image">
                <img
                  src={img_links[travel_demand_start_src]}
                  alt="Trip start time"
                />
                <div>Trip start time</div>
              </div>
            </div>

            <div>
              BEV travel demand
            </div>
          </div>
        </div>

        <div className="section">
          <div className="subtitle">
            Charging demand by users' behaviour
          </div>
          <div>
            For commute trips, charging can happen at the destinations
            during the parking time. Users’ charging decision is related
            to the state of charge (SOC) of the EVs and charging options
            including charging power and price. Different charging behaviour
            can lead to different charging demand distribution.
          </div>

          <div className="selection">
            <div> Choose User Behaviour</div>
            <Select
              onChange={handleUserBehaviorChange}
              options={userBehaviorOptions}
              defaultValue={optionsState.user_behavior}
              className="selection_box"
            />
          </div>

          <div className="dual_image">
            <div className="left_image">
              <img
                src={img_links[charging_demand_energy_total_src]}
                alt="EnergyTotal_name"
              />
              <div>Spatial distribution of energy demand in a 24-hour period</div>
            </div>

            <div className="right_image">
              <img
                src={img_links[charging_demand_energy_percent_src]}
                alt="EnergyPercent_name"
              />
              <div>Percentage of energy demand by locations and charging modes</div>
            </div>
          </div>

          <div className="triple">
            <div className="images">
              <div className="image">
                <img
                  src={img_links[charging_demand_power_home_src]}
                  alt="PowerAllHome_name"
                />
                <div>Residential area, level 2</div>
              </div>
              <div className="image">
                <img
                  src={img_links[charging_demand_power_not_home_slow_src]}
                  alt="PowerAllNotHomeSlow_name"
                />
                <div>Non-residential area, level 2</div>
              </div>
              <div className="image">
                <img
                  src={img_links[charging_demand_power_not_home_fast_src]}
                  alt="PowerAllNotHomeDCFC_name"
                />
                <div>Non-residential area, DCFC</div>
              </div>
            </div>

            <div>
              Temporal distribution of charging demand in a 24-hour period by locations and charging modes
            </div>

          </div>
          <div className="triple">
            <div className="images">
              <div className="image">
                <img
                  src={img_links[charging_demand_energy_home_src]}
                  alt="PowerAllHome_name"
                />
                <div>Residential area, level 2</div>
              </div>
              <div className="image">
                <img
                  src={img_links[charging_demand_energy_not_home_slow_src]}
                  alt="PowerAllNotHomeSlow_name"
                />
                <div>Non-residential area, level 2</div>
              </div>
              <div className="image">
                <img
                  src={img_links[charging_demand_energy_not_home_fast_src]}
                  alt="PowerAllNotHomeDCFC_name"
                />
                <div>Non-residential area, DCFC</div>
              </div>
            </div>

            <div>
              Spatial distribution of charging demand in a 24-hour period by locations and charging modes
            </div>
          </div>
        </div>

        <div className="section">
          <div className="subtitle">
            Average daily charging demand by charging mode
          </div>

          <div className="selection">
            <div> Choose your charging mode</div>
            <Select
              className="selection_box"
              onChange={handleChargingModeChange}
              options={chargingModeOptions}
              defaultValue={optionsState.charging_mode}
            />
          </div>

          <div className="slider_box">
            <div> Choose your start time</div>
            <div>
              <Slider
                className="slider"
                min={0}
                max={23}
                dots={true}
                included={false}
                step={1}
                railStyle={{
                  height: 10
                }}
                handleStyle={{ borderColor: "#B31B1B", height: 30, width: 30, marginTop: -10 }}
                dotStyle={{ borderColor: "#F8981D", height: 15, width: 15, marginBottom: -5 }}
                defaultValue={0}
                marks={{
                  0: { style: { color: '#B31B1B', fontSize: "30px", fontWeight: 'bold', marginTop: 10 }, label: "0:00" },
                  12: { style: { color: '#B31B1B', fontSize: "30px", fontWeight: 'bold', marginTop: 10 }, label: "12:00" },
                  23: { style: { color: '#B31B1B', fontSize: "30px", fontWeight: 'bold', marginTop: 10 }, label: "23:00" }
                }}
                handle={handle}
                onChange={handleStartTimeChange}
              />
            </div>
          </div>

          <div className="single_image">
            <img
              src={img_links[charging_demand_specific_src]}
              alt="Charging Demand Specific"
            />
            <div>Spatial-temporal distribution of charging demand in a 24-hour period</div>
          </div>
        </div>
        <div className="btnContent">
          <button className="pageBtn">Result from our research</button>
          <NavigateButton>
            {(navigate) => (
              <button
                className="pageBtn"
                onClick={() => navigate("/live-model")}
              >
                Live simulator - Atlanta Metropolitan Area
              </button>
            )}
          </NavigateButton>
        </div>
      </div>
    </div>
  );
}
export default Result;