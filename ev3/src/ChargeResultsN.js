import React from "react";
import { useEffect, useState, useRef } from "react"
import { useLocation, useParams } from "react-router-dom";
import { Col, Row, Spinner } from "react-bootstrap";
import Header from "./Header";
import RedirectBack from "./RedirectBack";
import * as d3 from 'd3';
import StateChart from "./StateChart";
import data from "bootstrap/js/src/dom/data";
import { jsPDF } from 'jspdf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCircleQuestion, faInfoCircle, faQuestionCircle} from '@fortawesome/free-solid-svg-icons';
import ReactTooltip from 'react-tooltip';
import JSZip from 'jszip';


const ChargeResultsN = () => {

    const [selectedChart, setSelectedChart] = useState('chart4');

    const [currentHour, setCurrentHour] = useState(24);
    const handleSliderChange = (event) => {
        const newHour = parseInt(event.target.value, 10);
        setCurrentHour(newHour);
    };

    const contentRef = useRef(null);
    const d3Container1 = useRef(null);


    const d3Container4 = useRef(null);
    const d3Container5 = useRef(null);

    const TDd3Container1 = useRef(null);
    const TDd3Container2 = useRef(null);
    const TDd3Container3 = useRef(null);
    const [TDcontentWidth, setTDcontentWidth] = useState(0);

    const d3Container6 = useRef(null);

    let { state } = useLocation();

    const {dayType} = state

    const [TDstatus, setTDstatus] = useState('loading');

    const [dataMapping, setDataMapping] = useState({});

      useEffect(() => {
        // Fetch the JSON data for visualization

          const {dayType, marketShare} = state
        fetch(' https://etransport.cee.cornell.edu/api/overview/'+ area + "?dayType=" + dayType + "&nov=" + marketShare)
          .then(response => response.json())
          .then(data => {
                  setDataMapping(data);
                  setTDstatus('completed');
                  setValues(prevValues => ({
                    ...prevValues,
                    EV_data: data.evData,
                    rate_V: data.rate
                }));
              }
          )
          .catch(error => console.error('Error fetching visualization data:', error));
    }, []);

    useEffect(() => {
        if(contentRef.current) {
            setTDcontentWidth(contentRef.current.offsetWidth);
        }
    }, []);

    const [jsonData, setJsonData] = useState(null);

    const [contentWidth, setContentWidth] = useState(0);

    useEffect(() => {
        if(contentRef.current) {
            setContentWidth(contentRef.current.offsetWidth);
        }
    }, []);


    function downloadData(){
        if (!jsonData) return;
    
        const data = jsonData;
        const multiplier = dataMapping.rate;
    
        const formatTime = (hour) => {
            let h = Math.floor(hour / 2);
            let m = (hour % 2) * 30;
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        };
    
        const convertTypeday = (typeday) => {
            let converted = {};
            for (let key in typeday) {
                converted[key.toLowerCase()] = {};
                for (let hour in typeday[key]) {
                    let time = formatTime(parseInt(hour));
                    converted[key.toLowerCase()][time] = parseFloat(typeday[key][hour] * multiplier).toFixed(2);
                }
            }
            return converted;
        };
    
        let filteredData = data.map(item => ({
            typeday: convertTypeday(item.typeday),
            charges: item.charges
        }));
    
        filteredData = filteredData.map(item => {
            let newItem = {};
          
            if (item.typeday && Object.keys(item.typeday).length > 0) {
              newItem["temporal distribution"] = item.typeday;
            }
          
            if (item.charges && Object.keys(item.charges).length > 0) {
              newItem["spatio distribution"] = item.charges;
            }
          
            return newItem;
        });
    
        filteredData = filteredData.filter(item => Object.keys(item).length > 0);
    
        const blob = new Blob([JSON.stringify(filteredData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
    
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SimulationData.json';
        a.click();
    
        window.URL.revokeObjectURL(url);
    }
    
    


    function pprint (type, value) {
        switch (type) {
          case 'risk':

              return value.substring(5)
          case 'willingness':
              return value.substring(12)
          case 'buffer':
              return value.substring(7) + '%'
          case 'dayType':
              return value.substring(0)
          default:
              return ''
        }
    }
 

    function downloadVisAll(){
        //mapRef.current.publicResetZoom();
        if (window.innerWidth <= 649){
            downloadVisPhone()
        }else {
            downloadVisComp()
        }
    }

    function svgToCanvas(svg) {
        return new Promise(resolve => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true, storage: 'persistent' });
            const serializer = new XMLSerializer();
            const svgStr = serializer.serializeToString(svg);

            const img = new Image();
            img.onload = () => {
                canvas.width = img.width * 10;
                canvas.height = img.height * 10;
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas);
            };
            img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgStr)));
        });
    }
    

    async function downloadVisComp() {
        // console.log(state)
        const addTitleToSvg = (svg, titleText, svgWidth, yPos) => {
        // Create a text element for the title
        const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
        title.setAttribute("x", svgWidth / 2);
        title.setAttribute("y", yPos+2);
        title.setAttribute("font-family", "sans-serif");
        title.setAttribute("font-size", "15");
        title.setAttribute("fill", "red");
        title.setAttribute("text-anchor", "middle");
        title.textContent = titleText;
        svg.insertBefore(title, svg.firstChild);
      };

        const addTextToSvg = (svg, text, svgWidth, yPos) => {
          const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
          textElement.setAttribute("x", svgWidth / 2);
          textElement.setAttribute("y", yPos);
          textElement.setAttribute("font-family", "sans-serif");
          textElement.setAttribute("font-size", "12");
          textElement.setAttribute("fill", "black");
          textElement.setAttribute("text-anchor", "middle");
          textElement.textContent = text;
          svg.appendChild(textElement);
        };

        const createSvgCloneWithTitles = (svg, titleText, svgWidth) => {
            const svgClone = svg.cloneNode(true);
            const yPos = 10;
            addTitleToSvg(svgClone, titleText, svgWidth, yPos);
            return svgClone;
        };

      // Select the original SVG elements
      const svg1 = d3.select(d3Container1.current).select('svg').node();
      const svg2 = d3.select(d3Container4.current).select('svg').node();
      const svg4 = d3.select(d3Container5.current).select('svg').node();

      const svgH1 = d3.select(TDd3Container1.current).select('svg').node();
      const svgH2 = d3.select(TDd3Container2.current).select('svg').node();
      const svgH3 = d3.select(TDd3Container3.current).select('svg').node();

      const svg10 = d3.select(d3Container6.current).select('svg').node();


      const svgMap = d3.select(".print-map-container").select('svg').node();

      // Get the dimensions of the SVGs
      const svg1Width = parseFloat(svg1.getAttribute("width"));
      const svg1Height = parseFloat(svg1.getAttribute("height"));
      const svg2Width = parseFloat(svg2.getAttribute("width"));
      const svg2Height = parseFloat(svg2.getAttribute("height"));

      const svg4Width = parseFloat(svg4.getAttribute("width"));
      const svg4Height = parseFloat(svg4.getAttribute("height"));

        const svgH1Width = parseFloat(svgH1.getAttribute("width"));
        const svgH2Width = parseFloat(svgH2.getAttribute("width"));
        const svgH3Width = parseFloat(svgH3.getAttribute("width"));

        const svgMapWidth = parseFloat(svgMap.getBoundingClientRect().width);
        const svgMapHeight = parseFloat(svgMap.getBoundingClientRect().height);

      // Create clones of each SVG with titles added
      const svg1Clone = createSvgCloneWithTitles(svg1, `Temporal distribution of demand`, svg1Width);
      const svg2Clone = createSvgCloneWithTitles(svg2, "Percentage of demand within 24 hours", svg2Width);
      const svg4Clone = createSvgCloneWithTitles(svg4, "Percentage of demand at different time", svg4Width);

      const svgH1Clone = createSvgCloneWithTitles(svgH1, "", svgH1Width);
      const svgH2Clone = createSvgCloneWithTitles(svgH2, "", svgH2Width);
      const svgH3Clone = createSvgCloneWithTitles(svgH3, "", svgH3Width);

      const svg6Clone = createSvgCloneWithTitles(svg10, "Total Demand", svg2Width);

      const svgMapClone = createSvgCloneWithTitles(svgMap, "", svgMapWidth);

      const scale = svg1Height / svgMapHeight;
      svgMapClone.setAttribute("transform", `scale(${scale})`);

      // Calculate the total width and height for the merged SVG
      const maxWidth = Math.max(svg1Width, svg2Width, svgMapWidth);
      const titleSpace = 250 + svgH2Width; // Additional space for each title
      const totalHeight = svg1Height + svg2Height + svg2Height + svgMapHeight + titleSpace * 2 + 250;

      // Create a new merged SVG element
      const mergedSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      mergedSVG.setAttribute("width", maxWidth.toString());
      mergedSVG.setAttribute("height", totalHeight.toString());

    const dataForSimulation1 = `Number of Vehicles: ${dataMapping?.oldnumVec}, ` +
                        `Number of Trips: ${dataMapping?.oldnumTrip}`;

    const dataForSimulation2 =
                        `Average Number of Trips per Vehicle: ${
                        dataMapping?.oldnumVec > 0
                            ? (dataMapping?.oldnumTrip / dataMapping?.oldnumVec).toFixed(2)
                            : 'N/A'
                        }, ` +
                        `Average Trip Distance: ${dataMapping?.aveDis} miles`;

    const parametersForSimulation1 = `State: ${area}`;

    const parametersForSimulation2 = `Number of Simulated Vehicles: ${state.marketShare}, Day Type: ${pprint('dayType', state.dayType)}`;
    
    const parametersForSimulation3 = `Home Charging Price: ${state.homePrice}, Public Charging Price: ${state.publicPrice}`;
    
    const parametersForSimulation4 = `Public L2 Charging Availability Rate: ${state.L2}, Public DCFC Availability Rate: ${state.DCFC}`;
    
    const parametersForSimulation5 = `Risk Sensitivity: ${pprint('risk', state.riskSensitivity)}, Willingness To Pay: ${pprint('willingness', state.willingnessToPay)}, Range Buffer: ${pprint('buffer', state.rangeBuffer)}`;
    

      addTitleToSvg(mergedSVG, "Data for the simulation",maxWidth, 20)
      addTextToSvg(mergedSVG, dataForSimulation1, maxWidth, 40);
      addTextToSvg(mergedSVG, dataForSimulation2, maxWidth, 60);
      addTitleToSvg(mergedSVG, "Parameters for the simulation",maxWidth, 110+svgH2Width)
      addTextToSvg(mergedSVG, parametersForSimulation1, maxWidth, 130+svgH2Width);
      addTextToSvg(mergedSVG, parametersForSimulation2, maxWidth, 150+svgH2Width);
      addTextToSvg(mergedSVG, parametersForSimulation3, maxWidth, 170+svgH2Width);
      addTextToSvg(mergedSVG, parametersForSimulation4, maxWidth, 190+svgH2Width);
      addTextToSvg(mergedSVG, parametersForSimulation5, maxWidth, 210+svgH2Width);

      addTitleToSvg(mergedSVG, "Results for the simulation",maxWidth, 240+svgH2Width);

        const svgH1XPos = 0;
        const svgH2XPos = svgH1Width;
        const svgH3XPos = svgH2XPos + svgH2Width;

        const gH1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gH1.setAttribute("transform", `translate(${svgH1XPos},75)`);
        gH1.appendChild(svgH1Clone);
        mergedSVG.appendChild(gH1);

        const gH2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gH2.setAttribute("transform", `translate(${svgH2XPos},75)`);
        gH2.appendChild(svgH2Clone);
        mergedSVG.appendChild(gH2);

        const gH3 = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gH3.setAttribute("transform", `translate(${svgH3XPos},75)`);
        gH3.appendChild(svgH3Clone);
        mergedSVG.appendChild(gH3);

	    addTitleToSvg(mergedSVG, "Data statistics chart",maxWidth, 90)

      svg1Clone.setAttribute("y", titleSpace.toString());
      mergedSVG.appendChild(svg1Clone);
      const g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g2.setAttribute("transform", `translate(0,${svg1Height + titleSpace + 50})`);
      g2.appendChild(svg2Clone);
      mergedSVG.appendChild(g2);
      const g4 = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g4.setAttribute("transform", `translate(${svg2Width},${svg1Height + titleSpace + 50})`);
      g4.appendChild(svg4Clone);
      mergedSVG.appendChild(g4);

      const g10 = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g10.setAttribute("transform", `translate(0,${svg1Height + titleSpace + svg2Height + 60})`);
      g10.appendChild(svg6Clone);
      mergedSVG.appendChild(g10);

      const gMap = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gMap.setAttribute("transform", `translate(0,${svg1Height + svg2Height+20})`);
      gMap.appendChild(svgMapClone);
      mergedSVG.appendChild(gMap);

      addTitleToSvg(mergedSVG, "Spatial distribution of trips",maxWidth, svg1Height + titleSpace + svg2Height + svg2Height+ 60);

      const canvas = document.createElement('canvas');

      // Serialize the merged SVG to a string
      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(mergedSVG);

      // Convert the serialized SVG to a Blob
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      // Create a temporary link element and trigger the download
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${area}_${state.dayType}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      const svgs = [
        { svg: svg1, title: 'Temporal_distribution_of_demand' },
        { svg: svg2, title: 'Percentage_of_demand_within_24_hours' },
        { svg: svg4, title: 'Percentage_of_demand_at_different_time' },
        { svg: svgH1, title: 'Data_statistics1' },
        { svg: svgH2, title: 'Data_statistics2' },
        { svg: svgH3, title: 'Data_statistics3' },
        { svg: svg10, title: 'Total_Demand' },
        { svg: svgMap, title: 'Spatial_distribution' },
    ];

    const zip = new JSZip();

    for (const { svg, title } of svgs) {
        const canvas = await svgToCanvas(svg);
        const pngData = canvas.toDataURL('image/png').split(',')[1];
        zip.file(title + '.png', pngData, {base64: true});
    }

    zip.generateAsync({type:"blob"}).then(function(content) {
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${area}_${state.dayType}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    }

    async function downloadVisPhone() {
        // console.log(state)
        const addTitleToSvg = (svg, titleText, svgWidth, yPos) => {
        // Create a text element for the title
        const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
        title.setAttribute("x", svgWidth / 2);
        title.setAttribute("y", yPos+2);
        title.setAttribute("font-family", "sans-serif");
        title.setAttribute("font-size", "15");
        title.setAttribute("fill", "red");
        title.setAttribute("text-anchor", "middle");
        title.textContent = titleText;
        svg.insertBefore(title, svg.firstChild);
      };

        const addTextToSvg = (svg, text, svgWidth, yPos) => {
          const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
          textElement.setAttribute("x", svgWidth / 2);
          textElement.setAttribute("y", yPos);
          textElement.setAttribute("font-family", "sans-serif");
          textElement.setAttribute("font-size", "12");
          textElement.setAttribute("fill", "black");
          textElement.setAttribute("text-anchor", "middle");
          textElement.textContent = text;
          svg.appendChild(textElement);
        };

        const createSvgCloneWithTitles = (svg, titleText, svgWidth) => {
            const svgClone = svg.cloneNode(true);
            const yPos = 10;
            addTitleToSvg(svgClone, titleText, svgWidth, yPos);
            return svgClone;
        };

      // Select the original SVG elements
      const svg1 = d3.select(d3Container1.current).select('svg').node();
      const svg2 = d3.select(d3Container4.current).select('svg').node();
      const svg4 = d3.select(d3Container5.current).select('svg').node();

      const svgH1 = d3.select(TDd3Container1.current).select('svg').node();
      const svgH2 = d3.select(TDd3Container2.current).select('svg').node();
      const svgH3 = d3.select(TDd3Container3.current).select('svg').node();

      const svg10 = d3.select(d3Container6.current).select('svg').node();


      const svgMap = d3.select(".print-map-container").select('svg').node();

      // Get the dimensions of the SVGs
      const svg1Width = parseFloat(svg1.getAttribute("width"));
      const svg1Height = parseFloat(svg1.getAttribute("height"));
      const svg2Width = parseFloat(svg2.getAttribute("width"));
      const svg2Height = parseFloat(svg2.getAttribute("height"));

      const svg4Width = parseFloat(svg4.getAttribute("width"));
      const svg4Height = parseFloat(svg4.getAttribute("height"));

        const svgH1Width = parseFloat(svgH1.getAttribute("width"));
        const svgH2Width = parseFloat(svgH2.getAttribute("width"));
        const svgH3Width = parseFloat(svgH3.getAttribute("width"));

        const svg10Width = parseFloat(svg10.getAttribute("width"));
        const svg10Height = parseFloat(svg10.getAttribute("height"));

        const svgMapWidth = parseFloat(svgMap.getBoundingClientRect().width);
        const svgMapHeight = parseFloat(svgMap.getBoundingClientRect().height);


      // Create clones of each SVG with titles added
      const svg1Clone = createSvgCloneWithTitles(svg1, `Temporal distribution of demand`, svg1Width);
      const svg2Clone = createSvgCloneWithTitles(svg2, "Percentage of demand within 24 hours", svg2Width);
      const svg4Clone = createSvgCloneWithTitles(svg4, "Percentage of demand at different time", svg4Width);

      const svgH1Clone = createSvgCloneWithTitles(svgH1, "", svgH1Width);
      const svgH2Clone = createSvgCloneWithTitles(svgH2, "", svgH2Width);
      const svgH3Clone = createSvgCloneWithTitles(svgH3, "", svgH3Width);

      const svg6Clone = createSvgCloneWithTitles(svg10, "Total Demand", svg2Width);

      const svgMapClone = createSvgCloneWithTitles(svgMap, "", svgMapWidth);

      const scale = svg1Height / svgMapHeight;
      svgMapClone.setAttribute("transform", `scale(${scale})`);

      const offSet = svgH1Width + svgH1Width
      // Calculate the total width and height for the merged SVG
      const maxWidth = Math.max(svg1Width, svg2Width);
      const titleSpace = 390 + svgH2Width+offSet; // Additional space for each title
      const totalHeight = svg1Height + svg2Height + svg2Height+ titleSpace + svg2Height + svgMapHeight + 390;

      // Create a new merged SVG element
      const mergedSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      mergedSVG.setAttribute("width", maxWidth.toString());
      mergedSVG.setAttribute("height", totalHeight.toString());

        const dataForSimulation1 = `Number of Vehicles: ${dataMapping?.oldnumVec}`;

        const dataForSimulation2 = `Number of Trips: ${dataMapping?.oldnumTrip}`;

        const dataForSimulation3 =
                          `Average Number of Trips per Vehicle: ${
                            dataMapping?.oldnumVec > 0
                              ? (dataMapping?.oldnumTrip / dataMapping?.oldnumVec).toFixed(2)
                              : 'N/A'
                          }`;

        const dataForSimulation4 =
                          `Average Trip Distance: ${dataMapping?.aveDis} miles`;

        const parametersForSimulation1 = `State: ${area}`;
        const parametersForSimulation5 = `Public Charging Price: ${state.publicPrice}`;
        const parametersForSimulation4 = `Home Charging Price: ${state.homePrice}`;
        const parametersForSimulation6 = `Public L2 Charging Availability Rate: ${state.L2}`;
        const parametersForSimulation7 = `Public DCFC Availability Rate: ${state.DCFC}`;
        const parametersForSimulation8 = `Risk Sensitivity: ${pprint('risk', state.riskSensitivity)}`;
        const parametersForSimulation9 = `Willingness To Pay: ${pprint('willingness', state.willingnessToPay)}`;
        const parametersForSimulation10 = `Range Buffer: ${pprint('buffer', state.rangeBuffer)}`;
        const parametersForSimulation2 = `Number of Simulated Vehicles: ${state.marketShare}`;
        const parametersForSimulation3 = `Day Type: ${state.dayType}`;

      addTitleToSvg(mergedSVG, "Data for the simulation",maxWidth, 20)

      addTextToSvg(mergedSVG, dataForSimulation1, maxWidth, 40);
      addTextToSvg(mergedSVG, dataForSimulation2, maxWidth, 60);
      addTextToSvg(mergedSVG, dataForSimulation3, maxWidth, 80);
      addTextToSvg(mergedSVG, dataForSimulation4, maxWidth, 100);
      addTitleToSvg(mergedSVG, "Parameters for the simulation",maxWidth, 150+svgH2Width+offSet)
      addTextToSvg(mergedSVG, parametersForSimulation1, maxWidth, 170+svgH2Width+offSet);
      addTextToSvg(mergedSVG, parametersForSimulation2, maxWidth, 190+svgH2Width+offSet);
      addTextToSvg(mergedSVG, parametersForSimulation3, maxWidth, 210+svgH2Width+offSet);
      addTextToSvg(mergedSVG, parametersForSimulation4, maxWidth, 230+svgH2Width+offSet);
      addTextToSvg(mergedSVG, parametersForSimulation5, maxWidth, 250+svgH2Width+offSet);
      addTextToSvg(mergedSVG, parametersForSimulation6, maxWidth, 270+svgH2Width+offSet);
      addTextToSvg(mergedSVG, parametersForSimulation7, maxWidth, 290+svgH2Width+offSet);
      addTextToSvg(mergedSVG, parametersForSimulation8, maxWidth, 310+svgH2Width+offSet);
      addTextToSvg(mergedSVG, parametersForSimulation9, maxWidth, 330+svgH2Width+offSet);
      addTextToSvg(mergedSVG, parametersForSimulation10, maxWidth, 350+svgH2Width+offSet);

      addTitleToSvg(mergedSVG, "Results for the simulation",maxWidth, 380+svgH2Width+offSet)

        const svgH1XPos = 130;
        const svgH2XPos = 130 + svgH1Width;
        const svgH3XPos = 130 + svgH1Width + svgH1Width;

        const gH1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gH1.setAttribute("transform", `translate(0, ${svgH1XPos})`);
        gH1.appendChild(svgH1Clone);
        mergedSVG.appendChild(gH1);

        const gH2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gH2.setAttribute("transform", `translate(0, ${svgH2XPos})`);
        gH2.appendChild(svgH2Clone);
        mergedSVG.appendChild(gH2);

        const gH3 = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gH3.setAttribute("transform", `translate(0, ${svgH3XPos})`);
        gH3.appendChild(svgH3Clone);
        mergedSVG.appendChild(gH3);

	    addTitleToSvg(mergedSVG, "Data statistics chart",maxWidth, 130)

      svg1Clone.setAttribute("y", titleSpace.toString());
      mergedSVG.appendChild(svg1Clone);
      const g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g2.setAttribute("transform", `translate(10,${svg1Height + titleSpace + 20})`);
      g2.appendChild(svg2Clone);
      mergedSVG.appendChild(g2);
      const g4 = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g4.setAttribute("transform", `translate(10,${svg1Height + svg2Height + titleSpace + 40})`);
      g4.appendChild(svg4Clone);
      mergedSVG.appendChild(g4);

      const g10 = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g10.setAttribute("transform", `translate(10,${svg1Height + svg2Height + titleSpace + svg2Height + 60})`);
      g10.appendChild(svg6Clone);
      mergedSVG.appendChild(g10);

      const gMap = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gMap.setAttribute("transform", `translate(0,${svg1Height + svg2Height + svg4Height + svg10Height + 270})`);
      gMap.appendChild(svgMapClone);
      mergedSVG.appendChild(gMap);

      addTitleToSvg(mergedSVG, "Spatial distribution of trips",maxWidth, svg1Height + svg2Height + titleSpace + svg2Height + svg2Height + 60)

      const canvas = document.createElement('canvas');

      // Serialize the merged SVG to a string
      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(mergedSVG);

      // Convert the serialized SVG to a Blob
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      // Create a temporary link element and trigger the download
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${area}_${state.dayType}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      const svgs = [
        { svg: svg1, title: 'Temporal_distribution_of_demand' },
        { svg: svg2, title: 'Percentage_of_demand_within_24_hours' },
        { svg: svg4, title: 'Percentage_of_demand_at_different_time' },
        { svg: svgH1, title: 'Data_statistics1' },
        { svg: svgH2, title: 'Data_statistics2' },
        { svg: svgH3, title: 'Data_statistics3' },
        { svg: svg10, title: 'Total_Demand' },
        { svg: svgMap, title: 'Spatial_distribution' },
    ];

    const zip = new JSZip();

    for (const { svg, title } of svgs) {
        const canvas = await svgToCanvas(svg);
        const pngData = canvas.toDataURL('image/png').split(',')[1];
        zip.file(title + '.png', pngData, {base64: true});
    }

    zip.generateAsync({type:"blob"}).then(function(content) {
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${area}_${state.dayType}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    }

    const { area } = useParams()

    let zoom = 1;

    const [status, setStatus] = useState('loading');

    const [values, setValues] = useState({})

    useEffect(() => {
        //console.log(state)

    if (!state || Object.keys(state).length !== 10) {
      return <RedirectBack/>;
    }

    const fetchData = async (retryLimit = 1, timeout = 360000000) => { // 120000ms = 2 minutes
        const {marketShare, BEVgroupShares, riskSensitivity, willingnessToPay, rangeBuffer } = state;
        state = {...state,area:area}
        const params = area + marketShare + BEVgroupShares.toString() + riskSensitivity + willingnessToPay + rangeBuffer;
        let attempts = 0;
        while (attempts < retryLimit) {
            try {
                const timeoutPromise = new Promise((_, reject) => {
                    const id = setTimeout(() => {
                        clearTimeout(id);
                        reject(new Error('Server is busy, please try again or try again later'));
                    }, timeout);
                });
                const response = await Promise.race([
                    fetch(' https://etransport.cee.cornell.edu/api/runsimulationmodelN', {
                        method: 'POST',
                        mode: 'cors',
                        body: JSON.stringify(state),
                        headers: { 'Content-Type': 'application/json' }
                    }),
                    timeoutPromise
                ]);

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setJsonData(data);
                setStatus('completed');
                break; // successful response, exit loop
            } catch (error) {
                console.error("There was a problem with the fetch operation:", error.message);
                attempts++;
                if (attempts === retryLimit) {
                    console.error(`Failed after ${retryLimit} attempts.`);
                }
            }
        }
    }
    fetchData().catch(err => console.log(err));
    }, []);


    useEffect(() => {
        if (status !== 'completed' || !contentRef.current) {
            return;
        }
        if (dataMapping && Object.keys(dataMapping).length !== 0) {
            let width = TDcontentWidth * 0.3;
            if (window.innerWidth <= 649){
                width = TDcontentWidth * 0.7
            }
          //console.log(dataMapping)
          if (TDd3Container1.current) {
              drawHistogram1(TDd3Container1.current, width/1, dataMapping.EV_list)
          }
          if (TDd3Container2.current) {
              drawHistogram2(TDd3Container2.current, width/1, dataMapping.distance)
          }
          if (TDd3Container3.current) {
              drawHistogram3(TDd3Container3.current, width/1, dataMapping.start_period)
          }

      }
        if (jsonData) {
            let usedata = jsonData
            let width = contentWidth * 0.9;
            if (d3Container1.current) {
                drawChart1(d3Container1.current, width, usedata[0]);
            }

            width = width * 0.5

            if (window.innerWidth <= 649){
                width = contentWidth * 0.7
            }

            if (d3Container4.current) {
                //console.log(usedata)
                drawChart4(d3Container4.current, width, usedata[0], selectedChart);
            }

            if (d3Container5.current) {
                //console.log(usedata)
                drawChart5(d3Container5.current, width, usedata[0], currentHour);
            }

            if (d3Container6.current) {
                //console.log(usedata)
                drawChart6(d3Container6.current, width, usedata[0], currentHour);
            }

        }
    }, [status, contentWidth, currentHour, dataMapping, TDcontentWidth, selectedChart]);

  function drawHistogram1(container, width, data) {
    d3.select(container).selectAll("*").remove();
    let height = width;
    data = Object.entries(data);
    const counts = {};
    data.forEach(([_, value]) => {
        if (!counts[value]) counts[value] = 0;
        counts[value]++;
    });

    const countEntries = Object.entries(counts);
    const totalCount = data.length;

    const margin = {top: 20, right: 20, bottom: 35, left: 60},
        actualWidth = width - margin.left - margin.right,
        actualHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const maxVal = Math.max(...countEntries.map(d => +d[0]));
    const xDomain = Array.from({length: maxVal + 1}, (_, i) => i.toString());

    const x = d3.scaleBand()
        .domain(xDomain)
        .range([0, actualWidth])
        .padding(0.1);

    // Calculate proportions
    countEntries.forEach(d => {
        d[1] = (d[1] / totalCount);
    });

    const y = d3.scaleLinear()
        .domain([0, d3.max(countEntries, d => d[1])])
        .range([actualHeight, 0]);

    const xAxis = d3.axisBottom(x)
        .tickValues(x.domain().filter((d, i) => !(i % 5)));

    const yAxis = d3.axisLeft(y)
        .tickFormat(d => d3.format(".2f")(d));

    svg.selectAll(".bar")
        .data(countEntries)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", (actualWidth / countEntries.length) * 0.6)
        .attr("height", d => actualHeight - y(d[1]))
        .attr("fill", "#5482B0");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + actualHeight + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", -5)
        .attr("dy", ".35em")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    svg.append("text")
        .attr("transform", "translate(" + (actualWidth / 2) + " ," + (actualHeight + margin.top + 13) + ")")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "black")
        .text("Number of trips per vehicle");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left+10)
        .attr("x", 0 - (actualHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "black")
        .text("Probability density");
  }
  function drawHistogram2(container, width, data) {
    d3.select(container).selectAll("*").remove();

    let height = width;
    data = Object.entries(data).map(d => d[1]);

    const histogram = d3.histogram()
        .domain(d3.extent(data))
        .thresholds(d3.range(d3.min(data), d3.max(data) + 5, 5));

    const bins = histogram(data);
    const totalCount = data.length;

    const margin = {top: 20, right: 20, bottom: 35, left: 60},
        actualWidth = width - margin.left - margin.right,
        actualHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleLinear()
        .domain(d3.extent(data))
        .range([0, actualWidth]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length / totalCount)])
        .range([actualHeight, 0]);

    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y).tickFormat(d3.format(".2f"));

    svg.selectAll(".bar")
        .data(bins)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.x0))
        .attr("y", d => y(d.length / totalCount))
        .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
        .attr("height", d => actualHeight - y(d.length / totalCount))
        .attr("fill", "#5482B0");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + actualHeight + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", -5)
        .attr("dy", ".35em")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    // Adding labels for the x and y axes
    svg.append("text")
        .attr("transform", "translate(" + (actualWidth / 2) + " ," + (actualHeight + margin.top + 13) + ")")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "black")
        .text("Trip distance (mile)");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left+10)
        .attr("x", 0 - (actualHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "black")
        .text("Probability density");
}
  function drawHistogram3(container, width, data) {
    d3.select(container).selectAll("*").remove();

    let height = width;
    data = Object.entries(data).map(d => parseFloat(d[1]));
    const totalCount = data.length; // Total number of data points

    const histogram = d3.histogram()
        .domain([0, d3.max(data)])
        .thresholds(d3.range(0, d3.max(data) + 2, 2));

    const bins = histogram(data);

    // Calculate proportions for each bin
    bins.forEach(bin => {
        bin.proportion = bin.length / totalCount;
    });

    const margin = {top: 20, right: 20, bottom: 35, left: 60},
        actualWidth = width - margin.left - margin.right,
        actualHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleLinear()
        .domain([0, d3.max(data)])
        .range([0, actualWidth]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.proportion)])
        .range([actualHeight, 0]);
        const xAxis = d3.axisBottom(x)
        .tickValues(d3.range(0, 49, 4)) 
        .tickFormat(d => {
            const hour = Math.floor(d / 2);
            return `${hour}:00`;
        });
	  
	  const yAxis = d3.axisLeft(y).tickFormat(d => d3.format(".2f")(d)); // Updated format for yAxis

    const binWidth = x(bins[0].x1) - x(bins[0].x0);

    svg.selectAll(".bar")
        .data(bins)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.x0))
        .attr("y", d => y(d.proportion))
        .attr("width", binWidth - 1)
        .attr("height", d => actualHeight - y(d.proportion))
        .attr("fill", "#5482B0");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + actualHeight + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", -5)
        .attr("dy", ".35em")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // Adding labels for the x and y axes
    svg.append("text")
        .attr("transform", "translate(" + (actualWidth / 2) + " ," + (actualHeight + margin.top + 13) + ")")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "black")
        .text("Trip start time (hour)");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left+10)
        .attr("x", 0 - (actualHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "black")
        .text("Probability density");
  }

    const drawChart1 = (container, width, usedata) => {
        d3.select(container).selectAll("*").remove();
        let tickValues = [];
        let extendedTimeLabels = [];

        //const timeLabels = ['0:15','2:15','4:15','6:15','8:15','10:15','12:15','14:15','16:15','18:15','20:15','22:15', '0:15','2:15','4:15','6:15','8:15','10:15','12:15','14:15','16:15','18:15','20:15','22:15'];
        const timeLabels = ['0:00','1:00','2:00','3:00','4:00','5:00','6:00','7:00','8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'];

        const numDays = 1;
        const dataPointsPerDay = 48;
        const dataPointsPerHour = 2;
        const data = usedata["typeday"]
        //console.log(data)
        for (let day = 0; day < numDays; day++) {
            for (let i = 0; i < dataPointsPerDay; i++) {
                tickValues.push(i + day * dataPointsPerDay);

                if (i % dataPointsPerHour === 0) {
                    extendedTimeLabels.push(timeLabels[i / dataPointsPerHour]);
                } else {
                    extendedTimeLabels.push("");
                }
            }
        }

        const margin = {top: 20, right: 20, bottom: 50, left: 55};
        const graphWidth = width - margin.left - margin.right;
        const graphHeight = width / 2 - margin.top - margin.bottom;

        const svg1 = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', width / 2)
            .append('g')  // Appending a group to translate our graph based on margins
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        const xScale = d3.scaleLinear()
            .domain([0, numDays * dataPointsPerDay - 1])
            .range([0, graphWidth]);

        const yMax = d3.max(Object.values(data), typeData =>
            d3.max(Object.values(typeData).map(d => d * dataMapping.rate)));


        const yScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([graphHeight, 0]);

        const lineGenerator = d3.line()
            .x((_, i) => xScale(i))
            .y(d => yScale(d * dataMapping.rate))
            .curve(d3.curveMonotoneX);

        Object.keys(data).forEach((typeKey, index) => {
            svg1.append('path')
                .datum(Object.values(data[typeKey]))
                .attr('d', lineGenerator)
                .attr('stroke', ["blue", "green", "orange"][index])
                .attr('stroke-width', 2)
                .attr('fill', 'none')
                .attr('class', 'linePath')
                .on("mouseover", function() {
                    svg1.selectAll(".linePath")
                        .transition().duration(150)
                        .style("opacity", 0.1)
                        .attr("stroke-width", 2);
                    d3.select(this)
                        .transition().duration(150)
                        .style("opacity", 0.9)
                        .attr("stroke-width", 4);
                })
                .on("mouseout", function() {
                    // reset opacity for all lines
                    svg1.selectAll(".linePath")
                        .transition().duration(150)
                        .style("opacity", 0.9)
                        .attr("stroke-width", 2);
                });
        });


        const xAxis = d3.axisBottom(xScale)
            .tickValues(tickValues)
            .tickFormat((d, i) => extendedTimeLabels[i]);

        svg1.append('g')
            .attr('transform', `translate(0, ${graphHeight})`)
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");;

        const yAxis = d3.axisLeft(yScale).tickFormat(d3.format(".2s"));
        svg1.append('g')
            .call(yAxis);

        svg1.append("text")
            .attr("transform", `translate(${graphWidth / 2}, ${graphHeight + margin.bottom - 5})`)  // position below x-axis
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .text("Time");

        svg1.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (graphHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .text("Charging power (kWh)");

        const legendColors = ["blue", "green", "orange"];
        const legendLabels = ["home", "public", "work"];
        const legend = svg1.selectAll(".legend")
            .data(legendLabels)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(0,${i * 20})`);

        legend.append("rect")
            .attr("x", graphWidth - 18)
            .attr("width", 18)
            .attr("height", 4)
            .style("fill", (d, i) => legendColors[i]);

        legend.append("text")
            .attr("x", graphWidth - 24)
            .attr("y", 1)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .style("font-size", "11px")
            .text(d => d)
    };

    const drawChart4 = (container, width, usedata, selectedChart) => {
        if (selectedChart === "chart4") {
            d3.select(container).selectAll("*").remove();

            const publicRate = jsonData[3].publicRate;
            const workRate = jsonData[4].workRate;

            usedata = usedata["typeday"];

            const sumValues = obj => obj ? Object.values(obj).reduce((sum, val) => sum + val, 0) : 0;

            const home_L2 = sumValues(usedata.Home) / 2 * dataMapping.rate;
            const public_L2 = sumValues(usedata.Public) / 2 * dataMapping.rate * publicRate;
            const work_L2 = sumValues(usedata.Work) / 2 * dataMapping.rate * workRate;

            const public_DCFC = sumValues(usedata.Public) / 2 * dataMapping.rate * (1 - publicRate);
            const work_DCFC = sumValues(usedata.Work) / 2 * dataMapping.rate * (1 - workRate);

            const initialPieData = [
                {category: "Home", value: home_L2},
                {category: "Work", value: work_L2 + work_DCFC},
                {category: "Public", value: public_L2 + public_DCFC}
            ];

            const sums = {
                Home: sumValues(usedata.Home),
                Public: sumValues(usedata.Public),
                Work: sumValues(usedata.Work)
            };

            // Prepare the data for the pie chart
            const pieData = Object.keys(sums).map(key => ({
                category: key,
                value: sums[key]
            }));

            // Color mapping
            const colorMapping = {
                Home_L2: "rgba(0, 0, 255, 0.3)",
                public_L2: "rgba(0, 128, 0, 0.3)",
                Work_L2: "rgba(255, 165, 0, 0.3)",
                public_DCFC: "rgba(0, 128, 0)",
                Work_DCFC: "rgba(255, 165, 0)",

                Home: "rgba(0, 0, 255, 0.7)",
                Public: "rgba(0, 128, 0, 0.7)",
                Work: "rgba(255, 165, 0, 0.7)"
            };

            // Set the dimensions and radius of the pie chart
            const height = width;
            const outerRadius = Math.min(width, height) / 3;
            const innerRadius = outerRadius / 2;

            const newSvgWidth = width * 0.75;

            const total = d3.sum(pieData, d => d.value);

            // Create the SVG container for the pie chart
            const svg4 = d3.select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', newSvgWidth)
                .append('g')
                .attr('transform', `translate(${width / 2}, ${newSvgWidth / 2})`);

            const centerText = svg4.append('text')
                .attr('text-anchor', 'middle')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .attr('dy', '0.35em'); // Centered in the middle of the pie

            // Create a pie generator
            const pie = d3.pie()
                .value(d => d.value)
                .sort(null);

            // Create an arc generator
            const arc = d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius);

            const drawPie = (data) => {
                svg4.selectAll('.arc').remove();

                const totalValue = d3.sum(data, d => d.value);

                const arcs = svg4.selectAll('.arc')
                    .data(pie(data), d => d.data.category)
                    .enter().append('g')
                    .attr('class', 'arc');

                arcs.append('path')
                    .attr('d', arc)
                    .attr('fill', d => colorMapping[d.data.category])
                    .style('stroke', 'white') // Add a white stroke to separate segments
                    .style('stroke-width', 2) // Initial stroke width
                    .on('click', function (event, d) {
                        if (d.data.category === 'Home') {
                            drawPie([
                                {category: "Home_L2", value: home_L2},
                                {category: "Work", value: work_L2 + work_DCFC},
                                {category: "Public", value: public_L2 + public_DCFC}
                            ]);
                        } else if (d.data.category === 'Work') {
                            drawPie([
                                {category: "Home", value: home_L2},
                                {category: "Work_L2", value: work_L2},
                                {category: "Work_DCFC", value: work_DCFC},
                                {category: "Public", value: public_L2 + public_DCFC}
                            ]);
                        } else if (d.data.category === 'Public') {
                            drawPie([
                                {category: "Home", value: home_L2},
                                {category: "Work", value: work_L2 + work_DCFC},
                                {category: "public_L2", value: public_L2},
                                {category: "public_DCFC", value: public_DCFC}

                            ]);
                        } else {
                            drawPie(initialPieData);
                        }
                    })
                    .on('mouseover', function (event, d) {
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .style('stroke-width', 9);
                        const percent = ((d.value / totalValue) * 100).toFixed(1) + '%';
                        centerText.text(percent);
                    })
                    .on('mouseout', function () {
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .style('stroke-width', 2);
                        centerText.text('');
                    });

                arcs.append('text')
                    .attr('transform', d => `translate(${arc.centroid(d)})`)
                    .attr('dy', '0.35em')
                    .attr('text-anchor', 'middle')
                    .style('opacity', d => d.data.value === 0 ? 0 : 1)
                    .text(d => d.data.category);
            };

            drawPie(initialPieData);
        }else if(selectedChart === "chart7"){

            d3.select(container).selectAll("*").remove();

            const publicRate = jsonData[3].publicRate;
            const workRate = jsonData[4].workRate;
            usedata = usedata["typeday"];

            const sumValues = obj => obj ? Object.values(obj).reduce((sum, val) => sum + val, 0) : 0;

            const home_L2 = sumValues(usedata.Home) / 2 * dataMapping.rate;
            const public_L2 = sumValues(usedata.Public) / 2 * dataMapping.rate * publicRate;
            const work_L2 = sumValues(usedata.Work) / 2 * dataMapping.rate * workRate;

            const public_DCFC = sumValues(usedata.Public) / 2 * dataMapping.rate * (1 - publicRate);
            const work_DCFC = sumValues(usedata.Work) / 2 * dataMapping.rate * (1 - workRate);

            const initialPieData = [
                { category: "L2", value: home_L2 + public_L2 + work_L2 },
                { category: "DCFC", value: public_DCFC + work_DCFC }
            ];

            const colorMapping = {
                Home_L2: "rgba(0, 0, 255, 0.3)",
                public_L2: "rgba(0, 128, 0, 0.3)",
                Work_L2: "rgba(255, 165, 0, 0.3)",
                public_DCFC: "rgba(0, 128, 0)",
                Work_DCFC: "rgba(255, 165, 0)",

                L2: "rgba(229, 57, 53, 0.3)",
                DCFC: "rgba(229, 57, 53)"
            };

            const height = width;
            const outerRadius = Math.min(width, height) / 3;
            const innerRadius = outerRadius / 2;

            const newSvgWidth = width * 0.75;

            const svg7 = d3.select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', newSvgWidth)
                .append('g')
                .attr('transform', `translate(${width / 2}, ${newSvgWidth / 2})`);

            const centerText = svg7.append('text')
                .attr('text-anchor', 'middle')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .attr('dy', '0.35em');

            const pie = d3.pie().value(d => d.value).sort(null);
            const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
            const drawPie = (data) => {
                svg7.selectAll('.arc').remove();

                const totalValue = d3.sum(data, d => d.value);

                const arcs = svg7.selectAll('.arc')
                    .data(pie(data), d => d.data.category)
                    .enter().append('g')
                    .attr('class', 'arc');

                arcs.append('path')
                    .attr('d', arc)
                    .attr('fill', d => colorMapping[d.data.category])
                    .style('stroke', 'white') // Add a white stroke to separate segments
                    .style('stroke-width', 2) // Initial stroke width
                    .on('click', function (event, d) {
                        if (d.data.category === 'L2') {
                            drawPie([
                                { category: "Home_L2", value: home_L2 },
                                { category: "public_L2", value: public_L2 },
                                { category: "Work_L2", value: work_L2 },
                                { category: "DCFC", value: public_DCFC + work_DCFC }
                            ]);
                        } else if (d.data.category === 'DCFC') {
                            drawPie([
                                { category: "L2", value: home_L2 + public_L2 + work_L2 },
                                { category: "public_DCFC", value: public_DCFC },
                                { category: "Work_DCFC", value: work_DCFC }

                            ]);
                        } else {
                            drawPie(initialPieData);
                        }
                    })
                    .on('mouseover', function (event, d) {
                        d3.select(this)
                      .transition()
                      .duration(200)
                      .style('stroke-width', 9);
                    const percent = ((d.value / totalValue) * 100).toFixed(1) + '%';
                    centerText.text(percent);
                    })
                    .on('mouseout', function () {
                        d3.select(this)
                      .transition()
                      .duration(200)
                      .style('stroke-width', 2);
                        centerText.text('');
                    });

                arcs.append('text')
                    .attr('transform', d => `translate(${arc.centroid(d)})`)
                    .attr('dy', '0.35em')
                    .attr('text-anchor', 'middle')
                    .style('opacity', d => d.data.value === 0 ? 0 : 1)
                    .text(d => d.data.category);
            };

            drawPie(initialPieData);
            }
    };

    const drawChart5 = (container, width, usedata, currentHour) => {

        d3.select(container).selectAll("*").remove();

        const publicRate = jsonData[3].publicRate;
        const workRate = jsonData[4].workRate;

        usedata = usedata["typeday"];

        //console.log(currentHour)

        const formatHour = hour => {
            const hours = Math.floor(hour / 2);
            const minutes = (hour % 2) * 30;
            return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
        };

        const displayTime = formatHour(currentHour);

        if (currentHour === 48){
            currentHour = 0
        }

        const startIndex = currentHour * 1;
        const endIndex = startIndex + 1;

        const homeArray = Object.values(usedata.Home);
        const publicArray = Object.values(usedata.Public);
        const workArray = Object.values(usedata.Work);

        const sums = {
            Home: homeArray.slice(startIndex, endIndex).reduce((sum, val) => sum + val, 0),
            Public: publicArray.slice(startIndex, endIndex).reduce((sum, val) => sum + val, 0),
            Work: workArray.slice(startIndex, endIndex).reduce((sum, val) => sum + val, 0)
        };

        const home_L2 = sums["Home"] / 2 * dataMapping.rate;
        const public_L2 = sums["Public"] / 2 * dataMapping.rate * publicRate;
        const work_L2 = sums["Work"] / 2 * dataMapping.rate * workRate;

        const public_DCFC = sums["Public"] / 2 * dataMapping.rate * (1 - publicRate);
        const work_DCFC = sums["Work"] / 2 * dataMapping.rate * (1 - workRate);

        const initialPieData = [
            { category: "Home", value: home_L2},
            { category: "Work", value: work_L2+work_DCFC },
            { category: "Public", value: public_L2+public_DCFC }
        ];

        // Prepare the data for the pie chart
        const pieData = Object.keys(sums).map(key => ({
            category: key,
            value: sums[key]
        }));

        // Color mapping
        const colorMapping = {
            Home_L2: "rgba(0, 0, 255, 0.3)",
            public_L2: "rgba(0, 128, 0, 0.3)",
            Work_L2: "rgba(255, 165, 0, 0.3)",
            public_DCFC: "rgba(0, 128, 0)",
            Work_DCFC: "rgba(255, 165, 0)",

            Home: "rgba(0, 0, 255, 0.7)",
            Public: "rgba(0, 128, 0, 0.7)",
            Work: "rgba(255, 165, 0, 0.7)"
        };

        // Set the dimensions and radius of the pie chart
        const height = width;
        const outerRadius = Math.min(width, height) / 3;
        const innerRadius = outerRadius / 2;

        const newSvgWidth = width * 0.75;

        let total = d3.sum(pieData, d => d.value);

        if (total === 0){
            total = 1
        }

        // Create the SVG container for the pie chart
        const svg5 = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', newSvgWidth)
            .append('g')
            .attr('transform', `translate(${width / 2}, ${newSvgWidth / 2})`);

        const centerTextGroup = svg5.append('g')
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold');

        const centerTimeText = centerTextGroup.append('text')
            .attr('dy', '-0.7em'); // Position above the percentage
        const time = displayTime;
        centerTimeText.text(time);

        const centerPercentageText = centerTextGroup.append('text')
            .attr('dy', '1em'); // Position below the time

        // Create a pie generator
        const pie = d3.pie()
            .value(d => d.value)
            .sort(null);

        // Create an arc generator
       const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        const drawPie = (data) => {
            svg5.selectAll('.arc').remove();

            const totalValue = d3.sum(data, d => d.value);

            const arcs = svg5.selectAll('.arc')
                .data(pie(data), d => d.data.category)
                .enter().append('g')
                .attr('class', 'arc');

            arcs.append('path')
                .attr('d', arc)
                .attr('fill', d => colorMapping[d.data.category])
                .style('stroke', 'white') // Add a white stroke to separate segments
                .style('stroke-width', 2) // Initial stroke width
                .on('click', function (event, d) {
                    if (d.data.category === 'Home') {
                        drawPie([
                            { category: "Home_L2", value: home_L2 },
                            { category: "Work", value: work_L2 + work_DCFC },
                            { category: "Public", value: public_L2 +public_DCFC }
                        ]);
                    } else if (d.data.category === 'Work') {
                        drawPie([
                            { category: "Home", value: home_L2},
                            { category: "Work_L2", value: work_L2 },
                            { category: "Work_DCFC", value: work_DCFC },
                            { category: "Public", value: public_L2+public_DCFC }
                        ]);
                    } else if (d.data.category === 'Public') {
                        drawPie([
                            { category: "Home", value: home_L2},
                            { category: "Work", value: work_L2+work_DCFC},
                            { category: "public_L2", value: public_L2 },
                            { category: "public_DCFC", value: public_DCFC }

                        ]);
                    }else {
                        drawPie(initialPieData);
                    }
                })
                .on('mouseover', function (event, d) {
                    d3.select(this)
                  .transition()
                  .duration(200)
                  .style('stroke-width', 9);
                const percent = ((d.value / totalValue) * 100).toFixed(1) + '%';
                centerPercentageText.text(percent);
                })
                .on('mouseout', function () {
                    d3.select(this)
                  .transition()
                  .duration(200)
                  .style('stroke-width', 2);
                    centerPercentageText.text('');
                });

            arcs.append('text')
                .attr('transform', d => `translate(${arc.centroid(d)})`)
                .attr('dy', '0.35em')
                .attr('text-anchor', 'middle')
                .style('opacity', d => d.data.value === 0 ? 0 : 1)
                .text(d => d.data.category);
        };

        drawPie(initialPieData);
    };

    const drawChart6 = (container, width, usedata) => {
        //console.log(usedata)
        d3.select(container).selectAll("*").remove();

        const publicRate = jsonData[3].publicRate
        const workRate = jsonData[4].workRate

        usedata = usedata["typeday"];

        const sumValues = obj => obj ? Object.values(obj).reduce((sum, val) => sum + val, 0) : 0;

        const Home_L2 = sumValues(usedata.Home) / 2 * dataMapping.rate;
        const public_L2 = sumValues(usedata.Public) / 2 * dataMapping.rate * publicRate;
        const public_DCFC = sumValues(usedata.Public) / 2 * dataMapping.rate * (1 - publicRate);
        const Work_L2 = sumValues(usedata.Work) / 2 * dataMapping.rate * workRate;
        const Work_DCFC = sumValues(usedata.Work) / 2 * dataMapping.rate * (1 - workRate);

        // Set the dimensions of the bar chart
        const height = width*0.7;
        const margin = {top: 30, right: 40, bottom: 50, left: 50};
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Color mapping, similar to the pie chart
        const colorMapping = {
            Home: "rgba(0, 0, 255, 0.3)",
            Public: "rgba(0, 128, 0, 0.3)",
            Work: "rgba(255, 165, 0, 0.3)",
            Total: "rgba(229, 57, 53, 0.3)"
        };

        const adjustOpacity = (color, opacity) => {
        const [r, g, b] = color.match(/\d+/g).map(Number);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        };

        const stackedData = {
            Total: [Home_L2 + public_L2 + Work_L2, public_DCFC + Work_DCFC],
            Home: [Home_L2, 0],
            Public: [public_L2, public_DCFC],
            Work: [Work_L2, Work_DCFC]
        };
        // Create the SVG container for the bar chart
        const svg6 = d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        const sums = {
            Total: sumValues(usedata.Home)/2* dataMapping.rate + sumValues(usedata.Public)/2* dataMapping.rate + sumValues(usedata.Work)/2* dataMapping.rate,
            Home: sumValues(usedata.Home)/2 * dataMapping.rate,
            Public: sumValues(usedata.Public)/2* dataMapping.rate,
            Work: sumValues(usedata.Work)/2* dataMapping.rate
        };
        // Create the scales
        const x = d3.scaleBand()
            .rangeRound([0, chartWidth])
            .padding(0.5)
            .domain(Object.keys(sums));

        const y = d3.scaleLinear()
            .range([chartHeight, 0])
            .domain([0, d3.max(Object.values(sums))]);

        // Tooltip for displaying values
        const tooltip = d3.select(container)
            .append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "lightgray")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("text-align", "center");

        // Create the bars
        svg6.selectAll(".category")
            .data(Object.entries(stackedData))
            .enter().append("g")
            .attr("class", "category")
            .attr("transform", d => `translate(${x(d[0])},0)`)
            .selectAll(".bar")
            .data(d => d[1].map((value, index) => ({ category: d[0], value: value, type: index === 0 ? "L2" : "DCFC" })))
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d.value + (d.type === "DCFC" ? stackedData[d.category][0] : 0)))
            .attr("height", d => chartHeight - y(d.value))
            .attr("width", x.bandwidth())
            .attr("fill", d => adjustOpacity(colorMapping[d.category], d.type === "L2" ? 0.6 : 1))
            .on("mouseover", function(event, d) {
                tooltip.style("visibility", "visible")
                       .text(`${d.type}: ${Math.round(d.value)}`)
                       .style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("visibility", "hidden");
            });

        // Add the x-axis
        svg6.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(d3.axisBottom(x));

        // Add the y-axis
        svg6.append("g")
            .call(d3.axisLeft(y).tickFormat(d3.format(".2s")));

        // X-axis label
        svg6.append("text")
            .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + margin.bottom - 30})`)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .style("fill", "black")
            .text("Charging type");

        // Y-axis label
        svg6.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (chartHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .style("fill", "black")
            .text("Demand (kWh)");

        const baseColorMapping = {
            Home: "rgba(0, 0, 255, 0.6)",
            Public: "rgba(0, 128, 0, 0.6)",
            Work: "rgba(255, 165, 0, 0.6)",
            Total: "rgba(229, 57, 53, 0.6)"
        };

        const categories = Object.keys(baseColorMapping);
        const legendSize = chartWidth/24;
        const legendSpacing = 1;

        const legend = svg6.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${chartWidth - chartWidth/6}, 5)`);

        categories.forEach((category, index) => {
            legend.append("rect")
                .attr("x", index * (legendSize + legendSpacing))
                .attr("y", 0)
                .attr("width", legendSize)
                .attr("height", legendSize)
                .style("fill", baseColorMapping[category]);

        categories.forEach((category, index) => {
            legend.append("rect")
                .attr("x", index * (legendSize + legendSpacing))
                .attr("y", legendSize + 5)
                .attr("width", legendSize)
                .attr("height", legendSize)
                .style("fill", baseColorMapping[category].replace(/0\.6\)$/, "1)"));
            });
        });

        legend.append("text")
            .attr("x", categories.length * (legendSize + legendSpacing))
            .attr("y", legendSize / 2)
            .attr("dy", ".35em")
            .text("L2")
            .style("font-size", "12px")
            .style("text-anchor", "start")
            .style("alignment-baseline", "middle");

        legend.append("text")
            .attr("x", categories.length * (legendSize + legendSpacing))
            .attr("y", legendSize /2 + 1.25*legendSize)
            .attr("dy", ".35em")
            .text("DCFC")
            .style("font-size", "12px")
            .style("text-anchor", "start")
            .style("alignment-baseline", "middle");

    };

    const handleRadioChange  = (event) => {
        setSelectedChart(event.target.value);
    };

    const resetMap = () => {
        console.log("charge results call resetMap");

    };

    const mapRef = useRef();

  return (
    <div>
      <Header/>
      <div className="big_title">BEV Charging Demand</div>
        <div className="content" ref={contentRef}>
    {status === 'loading' && (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <span style={{ marginLeft: '10px' }}>Running simulation, please wait... - It may take up to two minutes</span>
      </div>
    )}
    {status === 'completed' && (
      <>

        <div className="subtitle-small">Data for the simulation</div>
          <ul>
            <li>Number of Vehicles: {dataMapping?.oldnumVec}</li>
            <li>Number of Trips: {dataMapping?.oldnumTrip}</li>
             <li>
                Average Number of Trips per Vehicle: {
                  dataMapping?.oldnumVec > 0
                    ? (dataMapping?.oldnumTrip / dataMapping?.oldnumVec).toFixed(2)
                    : 'N/A'
                }
              </li>
            <li>Average Trip Distance: {dataMapping?.aveDis} miles</li>
            <div className="subtitle-small" style={{ marginTop: '50px' }}>Data statistics chart</div>
                  
                        <Row className="mb-3 container-class">
                        <Col sm={4}>
                            <div ref={TDd3Container1} id="TDdrawChart1"></div>
                        </Col>
                        <Col sm={4}>
                            <div ref={TDd3Container2} id="TDdrawChart2"></div>
                        </Col>
                        <Col sm={4}>
                            <div ref={TDd3Container3} id="TDdrawChart3"></div>
                        </Col>
                    </Row>

          </ul>

        <div className="subtitle-small" style={{ marginTop: '50px' }}>
            Parameters for the simulation
        </div>
        <div className="parameters">
    <div>
        <span className="key">State:</span> <span className="value">{area}</span>
    </div>
    <div>
        <span className="key">Number of Simulated Vehicles:</span> <span className="value">{state.marketShare}</span>
        <span className="key">Day Type:</span> <span className="value">{pprint('dayType', state.dayType)}</span>
    </div>
    <div>
        <span className="key">Home Charging Price:</span> <span className="value">{state.homePrice}</span>
        <span className="key">Public Charging Price:</span> <span className="value">{state.publicPrice}</span>
    </div>
    <div>
        <span className="key">Public L2 Charging Availability Rate:</span> <span className="value">{state.L2}</span>
        <span className="key">Public DCFC Availability Rate:</span> <span className="value">{state.DCFC}</span>
    </div>
    <div>
        <span className="key">Risk Sensitivity:</span> <span className="value">{pprint('risk', state.riskSensitivity)}</span>
        <span className="key">Willingness To Pay:</span> <span className="value">{pprint('willingness', state.willingnessToPay)}</span>
        <span className="key">Range Buffer:</span> <span className="value">{pprint('buffer', state.rangeBuffer)}</span>
    </div>
</div>
	    <div style={{ height: '20px' }}></div>
      <div className="subtitle-small" style={{ marginTop: '50px' }}>
        Results for the simulation
      </div>
        <div>
        <Row className="mb-3">
            <Col sm={12}>
                <div className="subtitle-small-four">
                    Temporal distribution of demand in {area}
                </div>
                <div ref={d3Container1} id="drawChart1"></div>
            </Col>
        </Row>
        <Row className="mb-3 container-class">
            <Col sm={6}>
                <div className="subtitle-small-four">
                    Percentage of demand within 24 hours
                    <span data-tip data-for="tooltipIdTotal">
                    <FontAwesomeIcon icon={faCircleQuestion} style={{ color: "#556482", marginLeft: "10px" }} />
                  </span>
                  <ReactTooltip id="tooltipIdTotal" effect="solid" className="custom-tooltip">
                    <span>This pie chart shows the overall proportion of charging power for each types in one day. Click the option below to switch the main category of the pie chart. Click on the pie chart to see details of different categories, touch the pie chart to see the specific proportions.</span><br />
                  </ReactTooltip>
                </div>
                <div ref={d3Container4} id="drawChart4"></div>
                <div className="slider-container">
                    Switch to other main categories
                        <label style={{ display: 'block' }}>
                            <input
                                type="radio"
                                value="chart4"
                                name="chartType"
                                checked={selectedChart === 'chart4'}
                                onChange={handleRadioChange}
                            />
                            Use Home / Work / Public as the main categories
                        </label>
                        <label style={{ display: 'block' }}>
                            <input
                                type="radio"
                                value="chart7"
                                name="chartType"
                                checked={selectedChart === 'chart7'}
                                onChange={handleRadioChange}
                            />
                            Use L2 / DCFC as the main categories
                        </label>
                </div>
            </Col>
            <Col sm={6}>
                <div className="subtitle-small-four">
                    Percentage of demand at different time
                    <span data-tip data-for="tooltipIdHours">
                    <FontAwesomeIcon icon={faCircleQuestion} style={{ color: "#556482", marginLeft: "10px" }} />
                  </span>
                  <ReactTooltip id="tooltipIdHours" effect="solid" className="custom-tooltip">
                    <span>This pie chart shows the proportion of each types (Home / Work / Public) of charging power at different times of the day. Click on the pie chart to see details of different categories, touch the pie chart to see the specific proportions. Slide the slider below to switch to other times</span><br />
                  </ReactTooltip>
                </div>
                <div ref={d3Container5} id="drawChart5"></div>
                <div className="slider-container">
             Switch to other times
            <div className="time-labels">
                <span>0:00</span>
                <span className="mid-time">12:00</span>
                <span>24:00</span>
            </div>
            <input
                type="range"
                min="0"
                max="48"
                value={currentHour}
                onChange={handleSliderChange}
                className="hour-slider"
            />
        </div>
            </Col>
        </Row>

        <Row className="mb-3 container-class" >
            <Col sm={6}>
                <div className="subtitle-small-four" style={{ marginTop: '50px' }}>
                    Total Demand
                    <span data-tip data-for="tooltipTD">
                    <FontAwesomeIcon icon={faCircleQuestion} style={{ color: "#556482", marginLeft: "10px" }} />
                  </span>
                  <ReactTooltip id="tooltipTD" effect="solid" className="custom-tooltip">
                    <span>Demand of different charging types and total demand (kWh). The light color (bottom) is L2, the dark color (top) is DCFC.</span><br />
                  </ReactTooltip>
                </div>
                <div ref={d3Container6} id="drawChart6"></div>
            </Col>
        </Row>
        <Row className="mb-3">
            <Col sm={12}>
                <div className="subtitle-small-four">
                    Spatial distribution of demand in {area}
                    <span data-tip data-for="tooltipMAP">
                    <FontAwesomeIcon icon={faCircleQuestion} style={{ color: "#556482", marginLeft: "10px" }} />
                  </span>
                  <ReactTooltip id="tooltipMAP" effect="solid" className="custom-tooltip">
                    <span>Spatial distribution of demand. Since it takes longer to render the Spatial distribution, please wait for a while if it is blank. Please download after rendering is complete</span><br />
                  </ReactTooltip>
                </div>
                <StateChart chargedata={jsonData[5]} state_name={area} ref={mapRef} datascale={dataMapping.rate} />
            </Col>
        </Row>
    <div className="btnContent" >
        <button className="pageBtn" onClick={downloadData}>Download Simulation Data</button>
        <button className="pageBtn" onClick={downloadVisAll}>Download Simulation visualization</button>
        </div>
      </div></>)}
        </div>
    </div>
  );
}

export default ChargeResultsN;

