export const PROJECT_TEMPLATES = [
     {
    emoji: "📋",
    title: "DataFlex CRUD – for the universal SaaS CRUD web app",
    description: "SaaS CRUD app with React/Next.js and Streamlit that connects to any REST API, supports full CRUD, auth, error handling, and responsive UI with search and sorting.",
    image: "./web-temp/CRUD.png",
    prompt: `
    Create a SaaS CRUD application that connects to a REST API and dynamically adapts its interface based on the API’s data structure. The front‑end should be built with React (preferably using Next.js) and the back‑end logic should be implemented in Python (using Streamlit for UI where applicable). The application must match the behavior of the provided example and include robust error handling to prevent unhandled HTTP 500 responses or other server errors. Front‑End (React / Next.js) Data Fetching and API Connection Implement a connect function that accepts an API endpoint (entered by the user) and optional custom headers (JSON formatted). Support bearer token authorization. On connection, fetch data from the API with fetch or axios. If the response status is not OK (e.g., returns a 500 or other error), catch the error and display a user‑friendly error message rather than letting the app crash. Extract columns dynamically and display formatted data as described previously. Adding, Updating, and Deleting Records For all POST, PUT, and DELETE requests, wrap calls in try/catch blocks. In the catch block: Retrieve the error message from err.response.data.message if available, falling back to err.message or a generic message such as “Failed to submit record” or “Failed to delete record.” Update state variables (setFormError, setErrorMsg, etc.) so that the UI displays the error clearly to the user. Ensure loading states (setLoading, setDeleteLoading, setDeleteAllLoading) are reset in a finally block even if an error occurs. Danger Zone – Delete All Records Implement a “Delete All Records” button as described earlier, but ensure that the deletion request is wrapped in a try/catch/finally block. If the API responds with an error (including HTTP 500), show an appropriate error message and do not clear the table or mark the app as disconnected. General Error Handling Add centralized error handling for fetch/axios calls. You can create a helper to process responses, check status codes, and throw exceptions with meaningful messages. Any unhandled errors (such as network issues) must be caught and surfaced to the user via state variables and UI messages. Make sure that onChange handlers always default to no‑op functions if not provided to avoid runtime errors like “onChange is not a function.” UI Feedback Use separate state variables for form errors (formError), general error messages (errorMsg), and success messages (successMsg). Display these messages prominently in the UI so users know exactly why an operation failed, instead of seeing a blank screen or an unhandled exception. Back‑End / Streamlit (Python) API Request Error Handling Wrap all calls to requests.get, requests.post, requests.put, and requests.delete in try/except blocks. On failure, use st.error to display a meaningful message. Catch both connection errors and HTTP errors (e.g., 500 status code). Use res.raise_for_status() after each request to trigger exceptions on non‑200 statuses and handle them appropriately. UI Feedback Within each form (add, update, delete, delete all), show success or error messages via st.success, st.error, and st.exception. Do not silently fail; always display a message when an exception occurs. Safe Defaults Provide default values for all expected inputs so that fields never remain undefined. For date and numeric fields, ensure that defaults are sensible (today’s date or 0.0) and that conversions to/from string or ISO format do not raise exceptions. Additional Requirements (unchanged) Use SelectItem only within SelectContent components. Implement smooth search and pagination (10 rows per page). Provide full CRUD capability (add, update, delete, delete all). Handle bearer token authentication. Ensure the app never returns an unhandled HTTP 500 error and always displays user‑friendly error messages. Parsing API Responses – The API may not return a plain array at the top level. When retrieving data, inspect the response to find the records array. If the response is an array, use it directly; otherwise, look for keys like data, results, or items that contain the array. Only if none of these keys are present should the code report an error such as “API did not return an array of records.” Ensure this logic is applied in all fetch calls, and surface any parsing errors to the user via clear error messages. Controlled Inputs: All form inputs must have both a value and an onChange handler. Provide a default no‑op onChange to avoid “onChange is not a function” errors and ensure that users can type into the form when adding or updating records. API Response Parsing: The API may wrap records in a data, results, or items property. Always extract the array of records from these keys before setting state. If no array is found, display a clear error message rather than assuming an empty array. Stable useEffect Hooks: Use dependency arrays on all useEffect hooks. Never call setState inside an effect that runs on every render. Instead, trigger data fetching when status or apiUrl changes, and recompute filtered data when the search term or rows change. Header‑Based API Configuration: Place API configuration fields in a persistent header bar instead of a modal. Connecting should set the API URL, custom headers, and bearer token, then trigger data fetching. Smooth CRUD and Pagination: Maintain working add, update, delete, and delete‑all functionality, with clear success/error messages and seamless pagination. Header Title: Include a persistent header at the top of the page. On the left side of this header, display the application title “SaaS CRUD” using a distinct font size and weight. Complete Imports: Ensure all React hooks (useState, useEffect, useMemo) and other dependencies (axios, etc.) are imported at the top of the file. Avoid missing imports or referencing undefined variables. Avoid Common Mistakes: Double‑check that state variables and handlers are defined before they are used, dependency arrays in useEffect hooks prevent infinite loops, and all asynchronous operations have error handling. This helps prevent simple errors such as “useState is not defined” or missing component imports. Client directive: Any file (page, component, or layout) that uses React hooks (useState, useEffect, useMemo, etc.) must start with "use client"; on the first line. Otherwise, Next.js will treat it as a server component and throw a build error. Separate client and server components: If only part of your code needs client‑side hooks, consider splitting it into a separate component marked with "use client".Responsive layout: Use responsive CSS classes (e.g., Tailwind flex, grid, lg:flex-row, overflow-x-auto) to ensure the UI looks good on phones, tablets, and desktops. Group API input fields and buttons in a flexible container that stacks on small screens and spreads out on larger screens.
    Table scrolling: Allow horizontal scrolling for the data table on narrow screens (overflow-x-auto) to prevent column squashing.
    Column sorting: Provide controls for users to sort records by any column in ascending or descending order. Implement sorting either through selectable drop‑downs or clickable column headers, and adjust the displayed rows based on the chosen column and direction.
    State management: Track the sort column and sort direction in React state, and recompute the displayed rows accordingly.  
    `},
   {
    emoji: "📦",
    title: "InsightGrid – for the 4-widgets API dashboard SaaS",
    description: "A powerful Next.js dashboard template that connects to Excel files or APIs and dynamically generates 4 business widgets based on data structure. Features include schema preview, connection health, Recharts, and Excel export.",
    image: "./web-temp/dashboard.png",
    prompt: `
   Build a Next.js SaaS dashboard that allows users to upload Excel files or connect to APIs, preview schema, configure widgets, and display raw data table below all 4 wieght. The interface must be fully interactive, scrollable, error-proof, and redirect users to a dashboard page after successful data connection. 🛠️ CRITICAL SYNTAX REQUIREMENTS (to avoid build errors): Add 'use client' directive at the top of the file Always import React: import React, { useState, useEffect } from 'react'; Use proper JSX syntax with lowercase HTML elements (div, nav, button) Import all required icons/components before using them: import { Database, Upload } from 'lucide-react'; Use className instead of class for CSS classes Ensure all JSX elements are properly closed Proper component export: export default function Dashboard() { return (...) } Wrap all content in a single parent div element 🚨 DYNAMIC RENDERING REQUIREMENTS (to avoid React object errors): 📋 DATA RENDERING RULES: NEVER render objects directly: ❌ {dataObject} ALWAYS extract object values: ✅ {dataObject.propertyName} Use Object.entries() for dynamic object rendering Use Array.map() for arrays Handle undefined/null values with fallbacks Always use String() conversion for mixed data types 📊 2. DASHBOARD - 4 DEFAULT WIDGETS (Renameable + Custom Graph Types) Default Widget Setup: const [widgets, setWidgets] = useState([ { id: 'widget1', title: 'Widget 1', graphType: 'bar', columns: [], data: [] }, do the same widget2 = line','widget3'='pie', 'widget4'= 'scatter' const [editingTitle, setEditingTitle] = useState<string | null>(null); Available Graph Types: const GRAPH_TYPES = [ { value: 'bar', label: 'Bar Chart', requiredColumns: 1 }, { value: 'stackedBar', label: '100% Stacked Bar', requiredColumns: 2 }, { value: 'line', label: 'Line Chart', requiredColumns: 2 }, { value: 'area', label: 'Area Chart', requiredColumns: 2 }, { value: 'pie', label: 'Pie Chart', requiredColumns: 1 }, { value: 'donut', label: 'Donut Chart', requiredColumns: 1 }, { value: 'scatter', label: 'Scatter Plot', requiredColumns: 2 }, { value: 'timeseries', label: 'Time Series Plot', requiredColumns: 2 }, { value: 'boxplot', label: 'Box Plot', requiredColumns: 2 }, { value: 'bubble', label: 'Bubble Chart', requiredColumns: 3 } ]; const COLORS = [random color]; // Apply colors to all chart components: Time Series Plot (Date format: "2025-07-29T09:42:07.972Z" - ISO 8601): case 'timeseries': // Processing for time series: case 'timeseries': return rawData .filter(row => row[columns[0]] && row[columns[1]]) .map(row => ({ date: new Date(row[columns[0]]).getTime(), value: Number(row[columns[1]]) || 0, originalDate: row[columns[0]] })) .sort((a, b) => a.date - b.date); 📈 STATISTICS SUMMARY REQUIREMENT: Add below each graph: const calculateStatistics = (data, graphType, columns) => { if (!data || data.length === 0) return null; const values = data.map(item => item.value || item.y || 0).filter(val => !isNaN(val)); if (values.length === 0) return null; const sum = values.reduce((a, b) => a + b, 0); also do avg, max, min return { total: sum, average: avg.toFixed(2), maximum: max, minimum: min, count: data.length }; }; // Display stats below each chart: {stats && ( <div className="mt-4 p-3 bg-gray-50 rounded-lg"> <h4 className="font-semibold text-sm mb-2 text-gray-700">Statistics Summary</h4> <div className="grid grid-cols-3 gap-2 text-xs"> <div><span className="font-medium">Total:</span> {stats.total}</div> do the same on Average, Count, Max and Min Widget Configuration Panel: function WidgetConfig({ widget, onUpdate, schema }) { const graphType = GRAPH_TYPES.find(g => g.value === widget.graphType); return ( <div className="bg-white p-4 rounded-lg border"> {/* Title Editing */} <div className="flex items-center justify-between mb-4"> {editingTitle === widget.id ? ( <input value={widget.title} onChange={e => onUpdate(widget.id, 'title', e.target.value)} onBlur={() => setEditingTitle(null)} onKeyDown={e => e.key === 'Enter' && setEditingTitle(null)} className="text-lg font-semibold border-b-2 border-blue-500 bg-transparent" autoFocus /> ) : ( <h3 className="text-lg font-semibold cursor-pointer hover:text-blue-600" onClick={() => setEditingTitle(widget.id)} > {widget.title} ✏️ </h3> )} </div> {/* Graph Type Selector */} <div className="mb-4"> <label className="block text-sm font-medium mb-2">Graph Type</label> <select value={widget.graphType} onChange={e => onUpdate(widget.id, 'graphType', e.target.value)} className="w-full border rounded px-3 py-2" > {GRAPH_TYPES.map(type => ( <option key={type.value} value={type.value}> {type.label} </option> ))} </select> {widget.graphType === 'timeseries' && ( <p className="text-xs text-gray-500 mt-1"> 📅 Date format: "2025-07-29T09:42:07.972Z" (ISO 8601) </p> )} </div> {/* Column Selectors */} <div className="mb-4"> <label className="block text-sm font-medium mb-2"> Data Columns ({graphType?.requiredColumns} required) </label> {Array.from({ length: graphType?.requiredColumns || 1 }).map((_, index) => ( <select key={index} value={widget.columns[index] || ''} onChange={e => { const newColumns = [...widget.columns]; newColumns[index] = e.target.value; onUpdate(widget.id, 'columns', newColumns); }} className="w-full border rounded px-3 py-2 mb-2" > <option value="">{\`Select Column \${index + 1}\`}</option> {schema.map(col => ( <option key={col.name} value={col.name}> {col.name} ({col.type}) </option> ))} </select> ))} </div> {/* Graph Rendering */} <div className="min-h-[300px] border rounded p-4"> {widget.columns.length >= (graphType?.requiredColumns || 1) ? ( <RenderGraph widget={widget} data={dashboardData} /> ) : ( <div className="flex items-center justify-center h-full text-gray-500"> Select columns to display {graphType?.label} </div> )} </div> </div> ); } Graph Rendering Component: import { BarChart, LineChart, PieChart, ScatterChart, AreaChart } from 'recharts'; function RenderGraph({ widget, data }) { const processedData = processDataForGraph(data, widget.graphType, widget.columns); switch (widget.graphType) { case 'bar': return ( <BarChart width={400} height={300} data={processedData}> <XAxis dataKey="name" /> <YAxis /> <Bar dataKey="value" fill={COLORS[0]} /> </BarChart> ); // ... and so on } } function processDataForGraph(rawData, graphType, columns) { // Process raw data based on graph type and selected columns switch (graphType) { case 'bar': case 'pie': case 'donut': return rawData.reduce((acc, row) => { const key = row[columns[0]]; const existing = acc.find(item => item.name === key); if (existing) existing.value++; else acc.push({ name: key, value: 1 }); return acc; }, []); case 'stackedBar': // Group by first column, stack by second column return rawData.reduce((acc, row) => { const key = row[columns[0]]; const stackKey = row[columns[1]]; const existing = acc.find(item => item.name === key); if (existing) { existing[stackKey] = (existing[stackKey] || 0) + 1; } else { acc.push({ name: key, [stackKey]: 1 }); } return acc; }, []); case 'scatter': return rawData.map(row => ({ x: Number(row[columns[0]]) || 0, y: Number(row[columns[1]]) || 0 })) case 'line': case 'area': return rawData.map((row, index) => ({ name: row[columns[0]] || \`Point \${index}\`, value: Number(row[columns[1]]) || 0 })); case 'bubble': return rawData.map(row => ({ x: Number(row[columns[0]]), y: Number(row[columns[1]]), z: Number(row[columns[2]]), })); case 'boxplot': return columns.map(col => ({ name: col, values: rawData.map(row => Number(row[col])).filter(v => !isNaN(v)) })); // and etc. default: return []; 📐 3. LAYOUT - 4 Widget Grid \`\`\`tsx <div className="h-screen overflow-y-auto px-4 py-6"> <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> {widgets.map(widget => ( <WidgetConfig key=.. widget=.. onUpdate=.. schema=.. /> ))} </div> </div> SAFE JSX RENDERING RULES Use Object.entries() and .map() for dynamic data Use String(value) and value ?? 'N/A' to safely render values Never render raw objects: ❌ {data} Always include key in loops Use Array.isArray(val) ? val.join(', ') : String(val) for arrays FINAL OUTCOMES Fully working "Connect Data" modal with Excel and API support Scrollable + sticky connect button Dashboard with 4 configurable widgets 10 smart graph types with vibrant colors Statistics summary below each graph Time series with proper date formatting Safe rendering logic throughout Responsive, scrollable, resizable layout No DOM errors (e.g., loading prop bug) make sure that non Chart type not implemented. TABLE REQUIREMENTS Column sorting (dropdowns or clickable headers) Pagination (10 rows/page with navigation) Search box for keyword filtering State management for sort column/direction
    `},
  {
    emoji: "🛰️",
    title: "JIBSense – for the sensor dashboard on JIBCHAIN",
    description: "Build a real-time sensor data dashboard using Viem.js to read smart contract values on JIBCHAIN L1. Includes latest readings, historical charts, and blockchain metadata with smooth UX and responsive design.",
    image: "./web-temp/SensorDashboard.png",
    prompt: `Create a Webapp using Viem.js to display sensor data from smart contracts on JIBCHAIN L1.

Connection Details:
- Chain ID: 8899
- RPC URL: https://rpc-l1.jbc.xpool.pw
- Block Explorer: https://exp.jibchain.net

Contract Addresses:
- Factory Contract: 0x63bB41b79b5aAc6e98C7b35Dcb0fE941b85Ba5Bb
- FloodBoy001 Store: 0xCd3Ec17ddFDa24f8F97131fa0FDf20e7cbd1A8Bb
- Universal Signer: 0xcB0e58b011924e049ce4b4D62298Edf43dFF0BDd (authorized for all stores)

Final UI Design (Latest Sensor Data Card):

Header Section:
- Title: "Latest Sensor Data"
- Store Nickname: Display nickname from factory contract (e.g., "FloodBoy001")
- Store Description: Display description from factory contract (e.g., "Northern Thailand Flood Monitor")
- Current Block: "Current Block: 5944625" (green dot indicator, no countdown)
- Updated timestamp: "Updated: 7:25:08 PM"
- Store address (truncated): "0xCd3Ec17d...d1A8Bb" with external link icon

Chart Section (Full Width):
- Display a full-width line chart with toggle controls
- Toggle between "Water Depth" and "Battery Voltage" views
- Chart titles: "Water Depth Over Time" / "Battery Voltage Over Time"
- Y-axis: Water depth in meters (scaled from x10000) OR Battery voltage in volts (scaled from x100)
- X-axis: Timestamp (last 24 hours or available data range)
- Chart colors: Blue (#3B82F6) for water depth, Green (#10B981) for voltage
- Full container width with proper responsive scaling
- Show data points and connect with smooth lines
- Include hover tooltips showing exact values and timestamps
- Toggle buttons above chart: [Water Depth] [Battery Voltage]
- Active toggle button highlighted with matching chart color
- Responsive design that works on mobile devices
- If no historical data available, show "No historical data available" message

Data Table:
Columns: Metric | Current | Min | Max
Rows:
- Battery Voltage: 12.910 V | 12.910 V | 12.910 V
- Installation Height: 3.02 m | 3.02 m | 3.02 m  
- Water Depth: 0.27 m | 0.27 m | 0.27 m

Footer:
- Last Updated: 7/22/2025, 7:25:08 PM
- Store Owner: 0x943E41e4cc22f971284ae957A380D3DbeA1Dc481 (truncated with link)
- Deployed Block: #5944625 (with block explorer link)
- Sensor Count: 1 authorized sensor

Data Processing Requirements:
Unit Scaling:
- x100 → divide by 100 (3 decimal places for voltage) - Example: 1291 → 12.910 V
- x1000 → divide by 1000 (3 decimal places) 
- x10000 → divide by 10000 (2-4 decimal places for meters) - Examples: 30200 → 3.02 m, 2700 → 0.27 m
- Extract base unit from unit string (e.g., "V" from "V x100", "m" from "m x10000")
- Format timestamps in human-readable format (MM/dd/yyyy, h:mm:ss AM/PM)
- Use appropriate decimal precision: voltage (3 decimals), meters (2 decimals for readability)

Visual Design:
- Clean white card with rounded corners and subtle shadow
- Store nickname prominently displayed as main heading
- Store description as subtitle below nickname
- Alternating row colors (white/light gray)
- Green status indicator for current block
- Truncated addresses with external link icons
- Sample count badges where applicable
- Responsive table layout
- Store metadata section with owner and deployment information

Features:
- Auto-refresh current block and data
- Display store nickname and description from factory contract
- Full-width chart with toggle between Water Depth and Battery Voltage views
- Toggle buttons with active state highlighting (matching chart colors)
- Loading indicators during data fetching
- Error handling with user-friendly messages
- Always use the universal signer (0xcB0e58b011924e049ce4b4D62298Edf43dFF0BDd) for data retrieval
- Show "No data" if no records exist
- Responsive chart scaling for all screen sizes
- Store metadata integration (nickname, description, owner, deployed block)

Historical Data Requirements:
- Use RecordStored events to build both water depth and battery voltage timelines
- Handle RPC limits with pagination (max 2000 blocks per request)
- Cache event data to reduce blockchain calls
- Dynamically find water depth AND battery voltage field indexes using getAllFields()
- Process both data types: water depth (x10000 scaling) and battery voltage (x100 scaling)
- Sort events by timestamp for proper chart ordering
- Support toggle between datasets without refetching data
- Include error handling for missing or corrupted event data
- Show loading state while fetching historical events
- Display "No historical data" message if events array is empty

Required ABIs for Webapp

Factory Contract ABI (Key Functions):
[
  {
    "name": "getStoreInfo",
    "inputs": [{"name": "store", "type": "address"}],
    "outputs": [
      {"name": "nickname", "type": "string"},
      {"name": "owner", "type": "address"},
      {"name": "authorizedSensorCount", "type": "uint256"},
      {"name": "deployedBlock", "type": "uint128"},
      {"name": "description", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

CatLabSecureSensorStore ABI (Key Functions):
[
  {
    "name": "getAllFields",
    "outputs": [{
      "components": [
        {"name": "name", "type": "string"},
        {"name": "unit", "type": "string"},
        {"name": "dtype", "type": "string"}
      ],
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "name": "getLatestRecord",
    "inputs": [{"name": "sensor", "type": "address"}],
    "outputs": [
      {"name": "", "type": "uint256"},
      {"name": "", "type": "int256[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

Note: Full ABIs are provided in /abis/ directory. 
Include complete ABIs in your implementation.

Implementation Example

import { createPublicClient, http } from 'viem';
import FactoryABI from '@/abis/CatLabFactory.json';
import StoreABI from '@/abis/CatLabSecureSensorStore.abi.json';

// JIBCHAIN L1 Configuration
const jibchain = {
  id: 8899,
  name: 'JIBCHAIN L1',
  rpcUrls: {
    default: { http: ['https://rpc-l1.jbc.xpool.pw'] }
  }
};

const client = createPublicClient({
  chain: jibchain,
  transport: http()
});

// Constants
const FACTORY_ADDRESS = '0x63bB41b79b5aAc6e98C7b35Dcb0fE941b85Ba5Bb';
const DEFAULT_STORE = '0xCd3Ec17ddFDa24f8F97131fa0FDf20e7cbd1A8Bb';
const UNIVERSAL_SIGNER = '0xcB0e58b011924e049ce4b4D62298Edf43dFF0BDd';

// Step 1: Get store information from factory contract
const [nickname, owner, sensorCount, deployedBlock, description] = await client.readContract({
  address: FACTORY_ADDRESS,
  abi: FactoryABI,
  functionName: 'getStoreInfo',
  args: [storeAddress]
});

// Display store metadata in UI
console.log('Store Info:', { nickname, description, owner, sensorCount, deployedBlock });

// Step 2: Get field configurations
const fields = await client.readContract({
  address: storeAddress,
  abi: StoreABI,
  functionName: 'getAllFields'
});

// Step 3: Get latest sensor data (using universal signer)
const [timestamp, values] = await client.readContract({
  address: storeAddress,
  abi: StoreABI,
  functionName: 'getLatestRecord',
  args: [UNIVERSAL_SIGNER]
});

// Step 4: Get historical data using event logs
// RecordStored event signature from CatLabSecureSensorStore:
// event RecordStored(address indexed sensor, uint256 timestamp, int256[] values)

// Method 1: Get recent events (recommended for charts)
const currentBlockNumber = await client.getBlockNumber();
const fromBlock = currentBlockNumber - BigInt(28800); // ~24 hours (assuming 3sec blocks)

const historicalEvents = await client.getContractEvents({
  address: storeAddress,
  abi: StoreABI,
  eventName: 'RecordStored',
  fromBlock: fromBlock,
  toBlock: 'latest',
  args: {
    sensor: UNIVERSAL_SIGNER // Filter by sensor address
  }
});

// Process chart data for toggle functionality
const waterDepthIndex = fields.findIndex(field => 
  field.name.toLowerCase().includes('water_depth') && !field.name.includes('min') && !field.name.includes('max')
);
const batteryVoltageIndex = fields.findIndex(field => 
  field.name.toLowerCase().includes('battery_voltage') && !field.name.includes('min') && !field.name.includes('max')
);

const chartData = historicalEvents.map(event => ({
  timestamp: Number(event.args.timestamp) * 1000, // Convert to milliseconds
  waterDepth: waterDepthIndex >= 0 ? Number(event.args.values[waterDepthIndex]) / 10000 : null,
  batteryVoltage: batteryVoltageIndex >= 0 ? Number(event.args.values[batteryVoltageIndex]) / 100 : null,
  blockNumber: Number(event.blockNumber)
})).sort((a, b) => a.timestamp - b.timestamp);

// Chart toggle state management
const [activeChart, setActiveChart] = useState('waterDepth'); // 'waterDepth' or 'batteryVoltage'

// Data processing function with correct decimal precision
function processValue(value, unit) {
  const baseUnit = unit.replace(/ x\d+/, '');
  if (unit.includes('x100')) return (Number(value) / 100).toFixed(3) + ' ' + baseUnit; // Voltage: 3 decimals
  if (unit.includes('x1000')) return (Number(value) / 1000).toFixed(3) + ' ' + baseUnit;
  if (unit.includes('x10000')) return (Number(value) / 10000).toFixed(2) + ' ' + baseUnit; // Meters: 2 decimals
  return value + ' ' + unit;
}

// Examples of correct processing:
// Battery voltage: 1291 (x100) → 12.91 V (showing as 12.910 V with 3 decimals)
// Installation height: 30200 (x10000) → 3.02 m
// Water depth: 2700 (x10000) → 0.27 m

Network Info:
Chain ID: 8899 (JIBCHAIN L1)
RPC URL: https://rpc-l1.jbc.xpool.pw
Block Explorer: https://exp.jibchain.net
FloodBoy001 Store: 0xCd3Ec17ddFDa24f8F97131fa0FDf20e7cbd1A8Bb

// For direct blockchain access commands (cast/curl), see the dedicated Open Data page: /opendata `
  }
];

// // version1
//    {
//     emoji: "📦",
//     title: " 4 widgets API Dashboard",
//     description: "A powerful Next.js dashboard template that connects to Excel files or APIs and dynamically generates 4 business widgets based on data structure. Features include schema preview, connection health, Recharts, and Excel export.",
//     image: "/web-temp/dashboard.png",
//     prompt: `Build a Next.js dashboard that starts with a powerful Data Connect system — allowing users to upload Excel files or connect to APIs — and then generates 4 business-focused widgets from the ingested data. 

// 🛠️ CRITICAL SYNTAX REQUIREMENTS (to avoid build errors):
// - Add 'use client' directive at the very top of the file
// - Always import React: \`import React, { useState, useEffect } from 'react';\`
// - Use proper JSX syntax with lowercase HTML elements (div, nav, button)
// - Import all required icons/components before using them: \`import { Database, Upload } from 'lucide-react';\`
// - Use className instead of class for CSS classes
// - Ensure all JSX elements are properly closed
// - Proper component export: \`export default function Dashboard() { return (...) }\`
// - Wrap all content in a single parent div element

// 🚨 DYNAMIC RENDERING REQUIREMENTS (to avoid React object errors):

// 📋 DATA RENDERING RULES:
// - NEVER render objects directly: ❌ {dataObject}
// - ALWAYS extract object values: ✅ {dataObject.propertyName}
// - Use Object.entries() for dynamic object rendering
// - Use Array.map() for arrays
// - Handle undefined/null values with fallbacks
// - Always use String() conversion for mixed data types

// 📊 DYNAMIC DATA DISPLAY PATTERNS:

// 1. **Object Properties Display:**
// \`\`\`jsx
// // ❌ Wrong - causes error
// <div>{rowData}</div>

// // ✅ Correct - extract values
// <div>{rowData.productName} - \${rowData.price}</div>

// // ✅ Dynamic object rendering
// {Object.entries(rowData).map(([key, value]) => (
//   <div key={key}>
//     <strong>{key}:</strong> {String(value)}
//   </div>
// ))}
// \`\`\`

// 2. **Table Data Rendering:**
// \`\`\`jsx
// // ✅ Dynamic table headers
// <thead>
//   <tr>
//     {columns.map(col => <th key={col}>{col}</th>)}
//   </tr>
// </thead>

// // ✅ Dynamic table rows
// <tbody>
//   {data.map((row, index) => (
//     <tr key={index}>
//       {columns.map(col => (
//         <td key={col}>{String(row[col] || '')}</td>
//       ))}
//     </tr>
//   ))}
// </tbody>
// \`\`\`

// 3. **Preview Data Display:**
// \`\`\`jsx
// // ✅ Safe object value rendering
// {previewData.map((item, index) => (
//   <div key={index} className="border p-2 rounded">
//     {Object.entries(item).map(([key, value]) => (
//       <span key={key} className="mr-4">
//         <strong>{key}:</strong> {value != null ? String(value) : 'N/A'}
//       </span>
//     ))}
//   </div>
// ))}
// \`\`\`

// 4. **Schema Preview:**
// \`\`\`jsx
// // ✅ Dynamic schema display
// {detectedColumns.map(column => (
//   <div key={column} className="flex justify-between p-2 border-b">
//     <span className="font-medium">{column}</span>
//     <span className="text-gray-500">
//       {typeof sampleData[0]?.[column]} | {String(sampleData[0]?.[column] || 'null')}
//     </span>
//   </div>
// ))}
// \`\`\`

// 📋 COMPONENT STRUCTURE TEMPLATE:
// \`\`\`jsx
// 'use client'
// import React, { useState, useEffect } from 'react';
// import { Database, Upload, Link, Download } from 'lucide-react';

// export default function Dashboard() {
//   // State and functions here
  
//   return (
//     <div className="min-h-screen flex flex-col bg-gray-50">
//       {/* Your dashboard content */}
//     </div>
//   );
// }
// \`\`\`

// 🔌 1. DATA CONNECT SYSTEM (Primary Focus)
// Add a "Connect Data" button in the top-right header. Clicking it opens a modal with two tabs:

// ➤ Tab 1: Excel Upload
// - Drag & drop zone with file input
// - Accepts .xlsx, .csv (max 50MB)
// - Preview first 10 rows in dynamic table using Object.entries()
// - Auto-detect headers & data types
// - Show column mapping options dynamically
// - Display file info: name, size, row count

// ➤ Tab 2: API Integration
// - Input fields: API Endpoint, Headers (JSON format), Auth method
// - Auth options dropdown: None, API Key, Bearer Token, OAuth
// - Button to test connection with loading state and response status
// - Optional: Auto-refresh toggle with interval selector (5, 15, 30 min)
// - Schema preview showing detected keys & sample values using dynamic rendering
// - Error handling for failed connections

// ➤ Data Status Panel (Always Visible in Header)
// - Connection health indicator: ✅ Connected / ⚠️ Partial / ❌ Disconnected
// - Last sync timestamp (formatted)
// - Connected source name (truncated if long)
// - Reconnect/refresh button
// - Data summary: X rows, Y columns

// 📊 2. DYNAMIC WIDGET GENERATION (After Connection)
// Once data is connected (Excel or API), auto-generate 4 visual widgets based on intelligent column analysis:

// - **Customer Widget**: Group by first text/string column, show top 10 values
// - **Account Widget**: Aggregate numeric columns (sum, average, min, max)
// - **Product Widget**: Category distribution using second text column (pie chart)
// - **Cross-Entity Widget**: Scatter plot or correlation between numeric columns

// Widget Requirements:
// - All charts use Recharts library with responsive containers
// - Interactive tooltips showing exact values
// - Color-coded data points using consistent palette
// - Loading states while generating
// - Empty states when no suitable data found
// - Dynamic titles based on actual column names

// 📥 3. DOWNLOAD EXCEL BUTTON
// Add "Download Excel Report" button in footer:
// - Export each widget data to separate Excel sheets
// - Include metadata sheet (source, timestamp, record count)
// - Filename: Dashboard_Report_{YYYY-MM-DD}.xlsx
// - Show download progress/success message

// 🛠️ TECH SPECS
// - Frontend: Next.js 15+ with React 18
// - File: app/page.tsx (add 'use client' at top)
// - Styling: TailwindCSS (use className, responsive grid)
// - Charts: Recharts library (BarChart, LineChart, PieChart, ScatterChart)
// - File Parsing: xlsx + papaparse libraries
// - Icons: lucide-react (Database, Upload, Link, Download, etc.)
// - API Calls: fetch with proper error handling
// - Layout: CSS Grid (2x2 widget layout), responsive design
// - Data Rendering: Dynamic with Object.entries() and Array.map()
// - Error Prevention: String conversion, null checks, fallbacks
// - State Management: useState for all interactive elements

// 📝 SAFE VALUE CONVERSION REQUIREMENTS:
// - Always use String(value) for mixed data types
// - Use value?.toString() with optional chaining
// - Add fallbacks: {value || 'N/A'} or {value ?? 'Unknown'}
// - Handle arrays: {Array.isArray(value) ? value.join(', ') : String(value)}
// - Never render raw objects in JSX
// - Use Object.entries() for object iteration
// - Implement proper key props for mapped elements

// ✅ REQUIRED OUTCOME
// ✅ One-click Excel Upload with dynamic schema detection
// ✅ API Integration with test connection + auto-refresh
// ✅ Real-time connection status indicators
// ✅ Dynamic generation of 4 analytics widgets from any data structure
// ✅ Excel export functionality with multiple sheets
// ✅ No build errors or JSX parsing issues
// ✅ No React object rendering errors
// ✅ Proper Next.js 15 client component structure
// ✅ Dynamic table generation from any data structure
// ✅ Safe object value rendering with type conversion
// ✅ Responsive design that works on all screen sizes
// ✅ Loading states and error handling throughout`
// },
