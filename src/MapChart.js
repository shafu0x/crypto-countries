import React, { useState, useRef } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

// d3-scale for color scale calculations
import { scaleLinear } from "d3-scale";
// If you want to use a predefined color palette (comment out if you prefer a custom range)
// import { interpolateOrRd } from "d3-scale-chromatic";

import getUnicodeFlagIcon from "country-flag-icons/unicode";

// Helper function to get country coordinates
const getCountryCoordinates = (countryCode) => {
  const coordinates = {
    US: [-95, 40],
    JP: [138, 36],
    GB: [-2, 54],
    DE: [11.41, 52.52],
    AE: [55.296233, 25.276987],
    CH: [8.55, 47.37],
    SG: [103.8198, 1.3521],
    KR: [127.7669, 35.9078],
    HK: [114.1694, 22.3193],
    CA: [-106.3468, 56.1304],
    AU: [133.7751, -25.2744],
    BR: [-55.0, -10.0],
    ZA: [25.0, -29.0],
    FR: [2.2137, 46.2276],
  };
  return coordinates[countryCode];
};

const MapChart = ({ data, geoUrl }) => {
  const [tooltipContent, setTooltipContent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [popupData, setPopupData] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  // Ref to keep track of the timeout for clearing the popup
  const popupTimeoutRef = useRef(null);

  // Handle mouse position for the tooltip
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

  // Marker mouse enter
  const handleMarkerMouseEnter = (countryData, countryCode, event) => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
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

  // Popup mouse events
  const handlePopupEnter = () => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
  };

  const handlePopupLeave = () => {
    popupTimeoutRef.current = setTimeout(() => {
      setPopupData(null);
    }, 200);
  };

  // Calculate the maximum number of companies for color scaling
  const maxCompanies = Math.max(
    ...Object.values(data).map((country) => country.companies.length)
  );

  // Create a d3 color scale (light to darker color)
  // Feel free to adjust the color range or use a different scale.
  const colorScale = scaleLinear()
    .domain([0, maxCompanies])
    .range(["#f0f9ff", "#2c7fb8"]); // from light-blue-ish to a deeper teal/blue

  // Alternatively, using a built-in scheme from d3-scale-chromatic:
  // const colorScale = scaleLinear()
  //   .domain([0, maxCompanies])
  //   .interpolate(() => interpolateOrRd);

  const getCountryFillColor = (countryCode) => {
    const countryData = data[countryCode];
    if (!countryData) return "#E0E0E0"; // countries with no data
    return colorScale(countryData.companies.length);
  };

  // We can also scale the marker size to reflect the number of companies (optional)
  // Just as an example, let's map [1..maxCompanies] to [4..10]
  const getMarkerRadius = (numCompanies) => {
    if (maxCompanies === 0) return 5; // fallback
    const minRadius = 4;
    const maxRadius = 10;
    return (
      minRadius +
      ((numCompanies - 1) / (maxCompanies - 1)) * (maxRadius - minRadius)
    );
  };

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <ComposableMap
        onMouseMove={handleMouseMove}
        projection="geoEquirectangular"
        projectionConfig={{
          scale: 150,
        }}
        style={{
          width: "100%",
          height: "100%",
          background: "#f8f9fa", // light background for contrast
        }}
      >
        <ZoomableGroup center={[0, 0]} zoom={1} minZoom={1} maxZoom={4}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryCode = geo.properties.ISO_A2;
                const countryData = data[countryCode];

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryFillColor(countryCode)}
                    stroke="#ffffff"
                    style={{
                      default: { outline: "none" },
                      hover: {
                        outline: "none",
                        // Lighten/darken or use a small opacity change for hover
                        fill: countryData ? "#62a8d8" : "#d0d0d0",
                        cursor: countryData ? "pointer" : "default",
                      },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={() =>
                      handleMouseEnter(countryData, geo.properties.NAME)
                    }
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })
            }
          </Geographies>

          {/* Marker Circles */}
          {Object.entries(data).map(([countryCode, countryData]) => {
            const coordinates = getCountryCoordinates(countryCode);
            if (!coordinates) return null;
            return (
              <Marker
                key={countryCode}
                coordinates={coordinates}
                onMouseEnter={(e) =>
                  handleMarkerMouseEnter(countryData, countryCode, e)
                }
                onMouseLeave={() => {
                  popupTimeoutRef.current = setTimeout(
                    () => setPopupData(null),
                    200
                  );
                }}
              >
                <circle
                  r={getMarkerRadius(countryData.companies.length)}
                  fill={colorScale(countryData.companies.length)}
                  stroke="#fff"
                  strokeWidth={1}
                  style={{ cursor: "pointer" }}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip for country hover */}
      {tooltipContent && (
        <div
          style={{
            position: "fixed",
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y + 10,
            background: "#ffffff",
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

      {/* Popup for marker click/hover */}
      {popupData && (
        <div
          className="popup-window"
          onMouseEnter={handlePopupEnter}
          onMouseLeave={handlePopupLeave}
          style={{
            position: "fixed",
            left: `${Math.min(
              Math.max(popupPosition.x, 175),
              window.innerWidth - 175
            )}px`,
            top: `${Math.min(
              Math.max(popupPosition.y - 10, 100),
              window.innerHeight - 20
            )}px`,
            transform: `translate(-50%, ${
              popupPosition.y > window.innerHeight - 200 ? "0" : "-100%"
            })`,
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "12px",
            minWidth: "280px",
            maxWidth: "350px",
            maxHeight: `${Math.min(400, window.innerHeight - 40)}px`,
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            zIndex: 1000,
            fontSize: "14px",
            border: "1px solid rgba(0,0,0,0.1)",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1rem",
              padding: "0.5rem",
              background: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <span
              style={{
                fontSize: "2.5rem",
                marginRight: "1rem",
              }}
            >
              {getUnicodeFlagIcon(popupData.countryCode)}
            </span>
            <div>
              <h3
                style={{
                  margin: "0",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#1a1a1a",
                }}
              >
                {popupData.countryCode}
              </h3>
              <p
                style={{
                  margin: "0.2rem 0 0 0",
                  color: "#666",
                  fontSize: "0.9rem",
                }}
              >
                {popupData.companies.length} Companies
              </p>
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "0.5rem",
            }}
          >
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "grid",
                gap: "0.5rem",
              }}
            >
              {popupData.companies.map((company, index) => (
                <li
                  key={index}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    background: "#f8f9fa",
                    fontSize: "0.9rem",
                    color: "#333",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                >
                  <a
                    href={company.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#333",
                      textDecoration: "none",
                      display: "block",
                      width: "100%",
                      height: "100%",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {company.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapChart;
