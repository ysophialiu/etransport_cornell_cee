import React from "react";
import "./general.css";
import { useNavigate } from "react-router-dom";
function NavButton() {
  const navigate = useNavigate();

  return (
    <button className="btn-primary" onClick={() => navigate("/python-package")}>
      Python Package
    </button>);
};
export default class PlacementResult extends React.Component {

  render() {
    const base = 'http://etransport.cee.cornell.edu/api/charging_placement';
    return (
      <div>
        <div className="content">
          <div className="subtitle">
            Trip Data Characteristics
          </div>
          <div>
            The trip data used was collected from a simulation by the Atlanta
            Regional Commission (ARC) using an agent-based model (ABM).
            This process studied synthetic data on 30,000 vehicles and their
            113,569 simulated trips on a typical weekday in 2030 in the Atlanta
            metropolitan area. The below figures detail some characteristics of
            the data used.
          </div>
          <div className="triple">
            <div className="images">
              <div className="image">
                <img src={base + "/trip_sample_num_trips"} alt="Distribution of number of trips" />
                <div> (a) Number of trips </div>
              </div>
              <div className="image">
                <img src={base + "/trip_sample_travel_time"} alt="Distribution of trip travel time" />
                <div> (b) Travel Time </div>
              </div>
              <div className="image">
                <img src={base + "/trip_sample_travel_distance"} alt="Distribution of trip travel distance" />
                <div> (c) Travel Distance </div>
              </div>
            </div>
          </div>
          <div className="double">
            <div className="images">
              <div className="image">
                <img src={base + "/trip_sample_trip_percent"} alt="Distribution of trips by purpose" />
                <div> (d) Percent of trips by purpose </div>
              </div>
              <div className="image">
                <img src={base + "/trip_sample_start_time"} alt="Distribution of trip start time by purpose" />
                <div> (e) Trip Start time by purpose </div>
              </div>
            </div>
          </div>
          <div className="section">
            <div className="subtitle">
              Optimal EV Charging Infrastructure Placement
            </div>
            <div>
              Using the data, simulating 30,000 BEV users with baseline parameters such
              as risk sensitivity, preference towards faster charging, prices of
              charging and commercial electricity. This simulation yielded the
              following optimal placements of Level 2 and Direct Current Fast
              Charging chargers.
            </div>
            <div className="double">
              <div className="images">
                <div className="image">
                  <img src={base + "/base_optimal_lv2"} alt="Optimal Level 2 Charging Station Placement for the Base Scenario" />
                  <div> (a) L2 Chargers Placement </div>
                </div>
                <div className="image">
                  <img src={base + "/base_optimal_dcfc"} alt="Optimal DCFC Charging Station Placement for the Base Scenario" />
                  <div> (b) DCFC Placement </div>
                </div>
              </div>
              <div> Optimal configurations of chargers found through simulation for the base scenario. </div>
            </div>
            <div>
              These results show that under these assumptions, charging stations
              are not necessary in much higher numbers in areas with greater travel
              demands - the distribution is spread out somewhat evenly across most
              areas.
            </div>
            <div>
              Under the optimal configuration found in our research, the
              average charging time was around 6.9 hours, with much shorter
              average charging times at work and in public and much longer
              average charging times at home.
            </div>
            <div className="triple">
              <div className="images">
                <div className="image">
                  <img
                    src={base + "/charge_time_home"}
                    alt="Charge Time Distribution (home)"
                  />
                  <div>(a) Home Chargers (L2) </div>
                </div>
                <div className="image">
                  <img
                    src={base + "/charge_time_public"}
                    alt="Charge Time Distribution (public)"
                  />
                  <div>(b) Public Chargers (L2 and DCFC) </div>
                </div>
                <div className="image">
                  <img
                    src={base + "/charge_time_work"}
                    alt="Charge Time Distribution (work)"
                  />
                  <div>(c) Work Chargers (L2 and DCFC) </div>
                </div>
              </div>
              <div> Charging times distribution based on location.</div>
            </div>
            <div className="section">
              <div className="subtitle">
                Effects of Parameters and Assumptions
              </div>
              <div>
                User charging preferences do not have a significant impact on the optimal
                number and ratio of Level 2 and DCFC chargers, but they do
                dramatically affect the optimal NPV generated by installing these
                charging stations.
              </div>
              <div className="single_image">
                <img src={base + "/risk_and_charging_speed"}
                  alt="Bar graph showing the optimal number of chargers for each setting of charging preference as well as the NPV of each scenario"
                />
                <div>The bar graphs show the optimal simulated charging station count for each scenario, and the box plots show the NPV of each scenario. </div>
              </div>
              <div>
                Public charging price, however, has a massive effect on charging
                station layouts and NPV. In general, the more expensive the price
                of charging, the number of charging stations in the optimal layout
                decreases and the NPV peaks at around $0.73/kWh and sharply
                decreases if perturbed.
              </div>
              <div className="single_image">
                <img src={base + "/charging_price"}
                  alt="Graph showing the effect of charging price on the optimal configuration and NPV" />
                <div>The bar graphs show the optimal simulated configurations of chargers in each situation. The line graph shows how the NPV is estimated to change with respect to the charging price. </div>
              </div>
              <div>
                Unsurprisingly, the more BEV users there are in the market,
                the more charging stations will be required and the more valuable
                this infrastructure becomes.
              </div>
              <div className="single_image">
                <img src={base + "/market_size"}
                  alt="Graph showing the effect of charging price on the optimal configuration and NPV" />
                <div>The bar graphs show the optimal simulated configurations of chargers in each situation. The line graph shows how the NPV is estimated to change with respect to the market size. </div>
              </div>
            </div>
            <div className="btnContent">
              <NavButton />
            </div>
          </div >
        </div >
      </div>

    )
  }
}
