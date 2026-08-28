# UAT Checklist --- Wildfire Hotspot Monitor

## Gate

**Functional User Acceptance Testing (UAT)**
**Application:** Wildfire Hotspot Monitor
**PoC:** POC-26
**Theme:** Real Rails Wildlife Intelligence
**Final status: `UAT PASS`**

## Test Objective

Validate that the Wildfire Hotspot Monitor supports the required user workflow, preserves existing functionality, renders hotspot data correctly, and provides usable dashboard interactions.

## Test Environment

- Application: Wildfire Hotspot Monitor
- Browser: Desktop web browser
- Data: Current application hotspot dataset
- Test approach: Manual functional validation
- Evidence: Dashboard execution and interaction checks

---

## UAT Test Results

### 1. Filters --- PASS

**Test:** Select ALL, VIIRS and MODIS sensor filters.

**Expected result:**
The hotspot and incident presentation updates according to the selected sensor.

**Result:** PASS

**Evidence:**
- ALL displays the complete hotspot set.
- VIIRS displays VIIRS hotspots.
- MODIS displays MODIS hotspots.
- Hotspot count updates with the filtered dataset.

---

### 2. Tooltips --- PASS

**Test:** Interact with hotspot markers on the geographic map.

**Expected result:**
The selected hotspot provides identifiable location and hotspot information.

**Result:** PASS

**Evidence:**
Hotspot interaction provides the relevant wildfire location and associated hotspot information.

---

### 3. Loading States --- PASS

**Test:** Refresh/load the application and observe the map loading state.

**Expected result:**
The application provides a loading indication while the dynamically loaded map component initializes.

**Result:** PASS

**Evidence:**
The dynamic map component provides a `Loading map...` state during initialization.

---

### 4. User Interactions --- PASS

**Tests performed:**

- Select hotspot marker.
- Select incident card.
- Change sensor filter.
- Move time-window slider.
- Use AOI snapshot export.

**Expected result:**
Each supported control responds without breaking the dashboard.

**Result:** PASS

---

### 5. Navigation --- PASS

**Test:** Navigate to and interact with the main dashboard interface.

**Expected result:**
The primary POC dashboard remains accessible and usable without broken navigation behaviour.

**Result:** PASS

---

### 6. Responsiveness --- PASS

**Test:** Check the dashboard at different browser presentation sizes, including maximized and reduced window sizes.

**Expected result:**
Core map, intelligence panel and key controls remain usable.

**Result:** PASS

**Evidence:**
Responsive layout classes and adjusted overlay positioning maintain the dashboard presentation across tested desktop viewport sizes.

---

### 7. Edge Cases --- PASS

**Tests performed:**

- Change sensor filter.
- Select different hotspot records.
- Select incidents with different intensity levels.
- Change time-window value.
- Review filtered hotspot count.

**Expected result:**
The dashboard continues rendering valid states without crashing.

**Result:** PASS

---

### 8. Error Handling --- PASS

**Test:** Review browser runtime behaviour after the implemented fixes and interact with the dashboard.

**Expected result:**
No unresolved runtime error prevents the dashboard from functioning.

**Result:** PASS

**Evidence:**
The earlier AOI export color-function issue was addressed by replacing `html2canvas` with `html2canvas-pro`.

---

### 9. Data Correctness --- PASS

**Test:** Verify displayed hotspot fields against the application's hotspot dataset.

**Fields checked:**

- ID
- Latitude
- Longitude
- Intensity
- Location
- Temperature
- Sensor

**Expected result:**
Displayed hotspot information corresponds to the defined application data.

**Result:** PASS

---

### 10. User Workflow Validation --- PASS

**Validated workflow:**

1. Open Wildfire Hotspot Monitor.
2. Observe the geographic wildfire map.
3. Review active hotspot markers.
4. Select a hotspot or incident.
5. Review selected region information.
6. Filter by sensor.
7. Adjust the time window.
8. Read WHY THIS MATTERS.
9. Read WHO CONTROLS THE RAIL.
10. Review system status and last update.
11. Use AOI snapshot export.

**Result:** PASS

The workflow communicates wildfire detection through operational intelligence in a logical sequence.

---

### 11. Frontend-to-Backend Communication --- NOT APPLICABLE

**Test:** Verify whether the current POC contains an active frontend-to-backend API integration.

**Result:** NOT APPLICABLE for the current frontend POC implementation.

**Reason:**
The current implementation uses the defined frontend hotspot dataset and does not expose an active backend API communication flow requiring UAT verification.

---

### 12. Browser Refresh Behaviour --- PASS

**Test:** Refresh the browser while viewing the dashboard.

**Expected result:**
The application initializes again and restores the dashboard without a persistent broken state.

**Result:** PASS

---

### 13. Empty or Unavailable Data Conditions --- PASS

**Test:** Review filtering behaviour where a sensor selection changes the displayed dataset.

**Expected result:**
The dashboard uses the filtered dataset and maintains valid UI structure.

**Result:** PASS

**Known limitation:**
A dedicated production empty/API-unavailable state is not currently required because the POC uses a local application dataset.

---

## Functional Feature Verification

| Feature | Result |
|---|---|
| Geographic map | PASS |
| Hotspot markers | PASS |
| Hotspot selection | PASS |
| Active incident cards | PASS |
| ALL sensor filter | PASS |
| VIIRS filter | PASS |
| MODIS filter | PASS |
| Time-window slider | PASS |
| Threat Intelligence panel | PASS |
| WHY THIS MATTERS | PASS |
| WHO CONTROLS THE RAIL | PASS |
| System status | PASS |
| Last update display | PASS |
| AOI snapshot export | PASS |

## Issues Identified During Development

1. Leaflet map instance reuse/runtime issues occurred during development.
2. AOI snapshot export initially encountered an unsupported `oklab` color-function error.
3. Dashboard overlays required responsive positioning adjustments.

## Issues Resolved

- Updated the map implementation to prevent the earlier map-instance reuse problem.
- Replaced `html2canvas` with `html2canvas-pro` for improved CSS color-function compatibility.
- Refined dashboard overlay positioning.
- Verified the intelligence sections are visible in the dashboard.
- Preserved hotspot data rendering and filtering functionality.

## Known Limitations

- The current POC uses a defined frontend hotspot dataset rather than a live production backend data pipeline.
- Frontend-to-backend communication is therefore not applicable to the current implementation.
- The time-window control currently represents the observation window UI; the displayed sample hotspot dataset is not dynamically replaced by a historical backend feed.
- Production authentication, live API availability monitoring and deployment-scale performance testing are outside the current POC scope.

## Final UAT Decision

# UAT PASS

The Wildfire Hotspot Monitor satisfies the functional UAT requirements for the current POC scope.

Core interactions, filtering, map rendering, hotspot selection, incident presentation, responsive dashboard behaviour, intelligence content and AOI export were validated.

The known limitations are documented and do not prevent the current POC workflow from functioning.

## UAT Status

**PASS**
