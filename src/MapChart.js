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

// Mapping of ISO country codes to their real names
const countryNames = {
  US: "United States",
  JP: "Japan",
  GB: "United Kingdom",
  DE: "Germany",
  AE: "United Arab Emirates",
  CH: "Switzerland",
  SG: "Singapore",
  KR: "South Korea",
  HK: "Hong Kong",
  CA: "Canada",
  AU: "Australia",
  BR: "Brazil",
  ZA: "South Africa",
  FR: "France",
  ES: "Spain",
};

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
    ES: [-3.75, 40],
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
    const realName = countryNames[countryCode] || countryCode;
    setPopupData({ ...countryData, countryCode, countryName: realName });
    setPopupPosition({ x: event.clientX, y: event.clientY });
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

  // Calculate popup positioning to ensure it remains on screen
  const popupWidth = 350; // maximum popup width
  const margin = 10; // viewport margin
  const calculatedPopupHeight = Math.min(400, window.innerHeight - 40);
  const popupWillBeAbove =
    popupData && popupPosition.y - calculatedPopupHeight - margin >= 0;
  const leftPosition = Math.min(
    Math.max(popupPosition.x, popupWidth / 2 + margin),
    window.innerWidth - popupWidth / 2 - margin
  );
  const rawTop = popupWillBeAbove
    ? popupPosition.y - margin
    : popupPosition.y + margin;
  const topPosition = Math.min(
    Math.max(rawTop, margin),
    window.innerHeight - calculatedPopupHeight - margin
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        background: "#1a1a2e",
      }}
    >
      <ComposableMap
        onMouseMove={handleMouseMove}
        projection="geoEquirectangular"
        projectionConfig={{
          scale: 150,
          center: [0, 0],
          rotate: [-10, 0, 0],
        }}
        style={{ width: "100%", height: "100%", background: "#1a1a2e" }}
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
            const numberOfCompanies = countryData.companies.length;
            const circleSize = Math.min(
              Math.max(Math.sqrt(numberOfCompanies) * 2, 4),
              12
            );
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
                <g>
                  {/* Glow effect */}
                  <circle
                    r={circleSize + 4}
                    fill="none"
                    stroke="rgba(255, 75, 75, 0.2)"
                    strokeWidth={4}
                    style={{ filter: "blur(4px)" }}
                  />
                  {/* Main circle */}
                  <circle
                    r={circleSize}
                    fill="url(#gradientCircle)"
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                    opacity={0.9}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      filter: "drop-shadow(0 0 4px rgba(255, 75, 75, 0.3))",
                    }}
                  />
                </g>
              </Marker>
            );
          })}
          <defs>
            <radialGradient id="gradientCircle" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF6B6B" />
              <stop offset="100%" stopColor="#FF4B4B" />
            </radialGradient>
          </defs>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip for country hover */}
      {tooltipContent && (
        <div
          style={{
            position: "fixed",
            left: "10px",
            top: "10px",
            background: "#fff",
            padding: "1rem",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            fontSize: "14px",
          }}
        >
          <h4 style={{ margin: "0 0 5px 0" }}>{tooltipContent.countryName}</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {tooltipContent.companies.map((company, index) => (
              <li key={index}>{company.name}</li>
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
            left: `${leftPosition}px`,
            top: `${topPosition}px`,
            transform: `translate(-50%, ${popupWillBeAbove ? "-100%" : "0"})`,
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "12px",
            minWidth: "280px",
            maxWidth: "350px",
            maxHeight: `${calculatedPopupHeight}px`,
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
                {popupData.countryName}
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
                    transition: "background-color 0.2s ease",
                    cursor: "default",
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
