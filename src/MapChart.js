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
    .range(["#0a192f", "#00b36b"]); // from dark blue to darker green

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
        background: "linear-gradient(to bottom, #0a192f 0%, #000000 100%)",
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
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
      >
        <ZoomableGroup center={[0, 0]} zoom={1} minZoom={1} maxZoom={4}>
          {/* Add a glowing grid effect */}
          <rect
            x="-5000"
            y="-5000"
            width="10000"
            height="10000"
            fill="url(#grid-pattern)"
            opacity="0.1"
          />

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
                    stroke="#00b36b"
                    strokeWidth={0.2}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        outline: "none",
                        fill: countryData ? "#00cc7a" : "#1a2634",
                        cursor: countryData ? "pointer" : "default",
                        filter: "drop-shadow(0 0 8px rgba(0, 179, 107, 0.5))",
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

          {/* Update Markers */}
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
                  {/* Enhanced glow effect */}
                  <circle
                    r={circleSize + 6}
                    fill="none"
                    stroke="rgba(0, 255, 157, 0.2)"
                    strokeWidth={4}
                    style={{ filter: "blur(6px)" }}
                  />
                  <circle
                    r={circleSize + 2}
                    fill="none"
                    stroke="rgba(0, 255, 157, 0.4)"
                    strokeWidth={2}
                    style={{ filter: "blur(2px)" }}
                  />
                  {/* Main circle */}
                  <circle
                    r={circleSize}
                    fill="url(#cyberGradient)"
                    stroke="#00ff9d"
                    strokeWidth={1.5}
                    opacity={0.9}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      filter: "drop-shadow(0 0 6px rgba(0, 255, 157, 0.5))",
                    }}
                  />
                </g>
              </Marker>
            );
          })}

          {/* Add new gradients and patterns */}
          <defs>
            <radialGradient id="cyberGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00cc7a" />
              <stop offset="100%" stopColor="#00b36b" />
            </radialGradient>

            <pattern
              id="grid-pattern"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#00b36b"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
        </ZoomableGroup>
      </ComposableMap>

      {/* Update tooltip style */}
      {tooltipContent && (
        <div
          style={{
            position: "fixed",
            left: "10px",
            top: "10px",
            background: "rgba(10, 25, 47, 0.95)",
            padding: "1rem",
            borderRadius: "8px",
            boxShadow: "0 0 20px rgba(0, 255, 157, 0.2)",
            fontSize: "14px",
            color: "#fff",
            border: "1px solid #00b36b",
            backdropFilter: "blur(5px)",
          }}
        >
          <h4 style={{ margin: "0 0 5px 0", color: "#00b36b" }}>
            {tooltipContent.countryName}
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {tooltipContent.companies.map((company, index) => (
              <li key={index} style={{ color: "#fff" }}>
                {company.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Update popup style */}
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
            background: "rgba(10, 25, 47, 0.95)",
            padding: "1.5rem",
            borderRadius: "12px",
            minWidth: "280px",
            maxWidth: "350px",
            maxHeight: `${calculatedPopupHeight}px`,
            overflowY: "auto",
            boxShadow: "0 0 30px rgba(0, 255, 157, 0.2)",
            zIndex: 1000,
            fontSize: "14px",
            border: "1px solid #00ff9d",
            backdropFilter: "blur(10px)",
            color: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1rem",
              padding: "0.5rem",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "8px",
              border: "1px solid rgba(0, 255, 157, 0.5)",
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
                  color: "#ffffff",
                }}
              >
                {popupData.countryName}
              </h3>
              <p
                style={{
                  margin: "0.2rem 0 0 0",
                  color: "#00b36b",
                  fontSize: "0.9rem",
                }}
              >
                {popupData.companies.length} Companies
              </p>
            </div>
          </div>
          <div
            style={{
              background: "transparent",
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
                    background: "rgba(255, 255, 255, 0.05)",
                    fontSize: "0.9rem",
                    color: "#fff",
                    transition: "all 0.2s ease",
                    cursor: "default",
                    border: "1px solid rgba(0, 255, 157, 0.3)",
                    "&:hover": {
                      background: "rgba(0, 255, 157, 0.1)",
                      borderColor: "#00ff9d",
                    },
                  }}
                >
                  <a
                    href={company.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#00b36b",
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
