// src/MapChart.jsx

import React, { useState, useRef } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import getUnicodeFlagIcon from "country-flag-icons/unicode";

const MapChart = ({ data, geoUrl }) => {
  const [tooltipContent, setTooltipContent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [popupData, setPopupData] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event) => {
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleMouseEnter = (countryData, countryName) => {
    if (countryData) {
      setTooltipContent({
        countryName,
        companies: countryData.companies,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltipContent(null);
  };

  const handleMarkerMouseEnter = (countryData, countryCode, event) => {
    // Get marker position relative to the map
    const rect = event.target.getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setPopupData({
      ...countryData,
      countryCode,
    });
  };

  // Calculate the maximum number of companies for color scaling
  const maxCompanies = Math.max(
    ...Object.values(data).map((country) => country.companies.length)
  );

  // Function to calculate color intensity
  const getHeatmapColor = (companyCount) => {
    const intensity = companyCount / maxCompanies;
    return `rgba(255, 0, 0, ${Math.max(0.2, intensity)})`; // minimum opacity of 0.2
  };

  return (
    <div style={{ width: "100%", height: "500px", position: "relative" }}>
      <ComposableMap onMouseMove={handleMouseMove}>
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryCode = geo.properties.ISO_A2;
                const countryData = data[countryCode];

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={countryData ? "#F53" : "#D6D6DA"}
                    stroke="#FFF"
                    onMouseEnter={() =>
                      handleMouseEnter(countryData, geo.properties.NAME)
                    }
                    onMouseLeave={handleMouseLeave}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        outline: "none",
                        fill: countryData ? "#F86" : "#E6E6EA",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {Object.entries(data).map(([countryCode, countryData]) => {
            // You'll need to add coordinates for each country
            const coordinates = getCountryCoordinates(countryCode);
            if (!coordinates) return null;

            return (
              <Marker
                key={countryCode}
                coordinates={coordinates}
                onMouseEnter={(e) =>
                  handleMarkerMouseEnter(countryData, countryCode, e)
                }
                onMouseLeave={() => setPopupData(null)}
              >
                <circle
                  r={5}
                  fill={getHeatmapColor(countryData.companies.length)}
                />
                <text
                  textAnchor="middle"
                  y={-10}
                  style={{ fontSize: "8px", fill: "#000" }}
                >
                  {`${countryData.companies.length} companies`}
                </text>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      {tooltipContent && (
        <div
          style={{
            position: "fixed",
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y + 10,
            background: "white",
            padding: "5px 10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ margin: "0 0 5px 0" }}>{tooltipContent.countryName}</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {tooltipContent.companies.map((company, index) => (
              <li key={index}>{company}</li>
            ))}
          </ul>
        </div>
      )}

      {popupData && (
        <div
          className="popup-window"
          style={{
            position: "fixed",
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y - 10}px`,
            transform: "translate(-50%, -100%)",
            background: "#fff",
            padding: "0.5rem",
            borderRadius: "4px",
            minWidth: "150px",
            maxWidth: "300px",
            maxHeight: "200px",
            overflowY: "auto",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            zIndex: 1000,
            fontSize: "12px",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "14px" }}>
            Companies in {getUnicodeFlagIcon(popupData.countryCode)}{" "}
            {popupData.countryCode}
          </h3>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            {popupData.companies.map((company, index) => (
              <li key={index}>{company}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Helper function to get country coordinates
const getCountryCoordinates = (countryCode) => {
  const coordinates = {
    US: [-95, 40],
    JP: [138, 36],
    GB: [-2, 54],
    // Add more country coordinates as needed
  };
  return coordinates[countryCode];
};

export default MapChart;
