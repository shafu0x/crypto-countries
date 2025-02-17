// src/App.js

import React from "react";
import MapChart from "./MapChart";
import cryptoData from "./cryptoData";

// We assume the file is stored in src, so we can import it directly if it's a small enough file
import geoData from "./world-geo.json";

function App() {
  return (
    <div>
      <h1>Crypto Companies Map</h1>
      <MapChart data={cryptoData} geoUrl={geoData} />
    </div>
  );
}

export default App;
