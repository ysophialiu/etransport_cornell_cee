import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './Homepage';
import ContactUs from './ContactUs';
import Result from './result';
import TravelDemand from './TravelDemand';
import LiveLaunch from './LiveLaunch';
import ChargeDemand from './ChargeBehavior';
import ChargeResults from './ChargeResults';
import ChargeResultsN from './ChargeResultsN';
import LiveLaunchN from "./LiveLaunchN";
import './general.css';
import Placement from './Placement';
import PlacementResult from './PlacementResults';
import PythonPackage from './PythonPackage';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <Routes>
      <Route exact path="/" element={<Homepage />} />
      <Route exact path="/atlanta-result" element={<Result />} />
      <Route exact path="/contact-us" element={<ContactUs />} />

      <Route exact path="/live-model" element={<LiveLaunch />} />
      <Route exact path="/live-modelN" element={<LiveLaunchN />} />

      <Route exact path="/live-model/travel-demand/:area" element={<TravelDemand />} />

      <Route exact path="/live-model/charging-model/:area" element={<ChargeDemand />} />

      <Route exact path="/live-model/charging-demand/:area" element={<ChargeResults />} />
      <Route exact path="/live-modelN/charging-demandN/:area" element={<ChargeResultsN />} />
      <Route exact path="/placement" element={<Placement />} />
      <Route exact path="/atlanta-placement" element={<PlacementResult />} />
      <Route exact path="/python-package" element={<PythonPackage />} />

    </Routes>
  </Router>
);