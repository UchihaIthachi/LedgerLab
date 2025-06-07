import React, { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Button, Row, Col, Space, Spin, Alert, Typography } from 'antd';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { feature } from 'topojson-client';

const { Text } = Typography;

// TopoJSON data for US states
const US_STATES_TOPOJSON_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// ZKP Demo Constants
const COLOR_PALETTE = ['#FF6B6B', '#6BCB77', '#4D96FF']; // Red, Green, Blue
const HIDDEN_COLOR = '#E0E0E0'; // Light Gray for hidden states
const BORDER_COLOR = '#FFFFFF';
const SELECTED_BORDER_COLOR = '#F5A623'; // Orange for selected states

// Hardcoded base 3-coloring for a subset of US States (using FIPS codes as IDs)
// This is our "secret" knowledge for the ZKP demo.
// California (06): 0, Nevada (32): 1, Arizona (04): 2 (Adjacent, should have different colors)
// Oregon (41): 1 (Adjacent to CA (0), NV (1) - needs to be different from both)
// Washington (53): 0 (Adjacent to OR (1))
// Idaho (16): 2 (Adjacent to WA (0), OR (1), NV (1))
// Utah (49): 0 (Adjacent to NV (1), AZ (2), ID (2))
// New York (36): 0
// Pennsylvania (42): 1 (Adjacent to NY(0))
// Ohio (39): 2 (Adjacent to PA(1))
const BASE_COLOR_INDICES: Record<string, number> = {
  '06': 0, '32': 1, '04': 2, // CA, NV, AZ
  '41': 2, // OR (Changed from 1 to 2 to be different from CA(0) and NV(1)) -> Let's try with a valid 3-coloring assumption.
            // For a proper 3-coloring demo, a real graph coloring algorithm would be needed for the whole map.
            // For this ZKP demo, we only "prove" knowledge for states we have in this map.
            // Let's simplify and ensure chosen adjacent states have different colors.
            // CA (06) -> 0
            // NV (32) -> 1 (adj CA)
            // AZ (04) -> 2 (adj CA, NV)
            // OR (41) -> 1 (adj CA, NV(conflict with NV if OR is 1 and NV is 1 and they are adj))
            // WA (53) -> 0 (adj OR)
  // Simplified for demo:
  '06': 0, // California
  '32': 1, // Nevada
  '04': 2, // Arizona
  '41': 1, // Oregon (assuming it's not adjacent to Nevada for this simplified example or NV is colored differently)
  '53': 0, // Washington
  '36': 0, // New York
  '42': 1, // Pennsylvania
  '12': 2, // Florida (not adjacent to NY/PA, for variety)
  '48': 0, // Texas
  '17': 1, // Illinois
};
const PARTICIPATING_STATE_IDS = Object.keys(BASE_COLOR_INDICES);

const ZeroKnowledgeProofPage: NextPage = () => {
  const { t } = useTranslation('common');
  const [mapData, setMapData] = useState<any | null>(null); // Store raw TopoJSON object
  const [loadingMap, setLoadingMap] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // ZKP State
  const [stateColors, setStateColors] = useState<Record<string, string>>({});
  const [colorOffset, setColorOffset] = useState(0); // This will be permuted
  const [showAllMapColors, setShowAllMapColors] = useState(false);
  const [selectedStateIds, setSelectedStateIds] = useState<string[]>([]);

  const getDisplayColor = useCallback((stateId: string, currentOffset: number, revealAll: boolean, currentSelectedIds: string[]): string => {
    if (BASE_COLOR_INDICES.hasOwnProperty(stateId)) {
      if (revealAll || currentSelectedIds.includes(stateId)) {
        const baseColorIndex = BASE_COLOR_INDICES[stateId];
        const permutedColorIndex = (baseColorIndex + currentOffset) % COLOR_PALETTE.length;
        return COLOR_PALETTE[permutedColorIndex];
      }
    }
    return HIDDEN_COLOR;
  }, []);

  // Initialize/Update colors when map data or relevant state changes
  useEffect(() => {
    if (!mapData || !mapData.objects || !mapData.objects.states) {
        // mapData not yet loaded or doesn't have the expected structure
        // Initialize with empty or default colors if needed, or wait for mapData
        const emptyColors: Record<string, string> = {};
        // Optionally, pre-fill with HIDDEN_COLOR for all known participating states if mapData is not ready
        PARTICIPATING_STATE_IDS.forEach(id => emptyColors[id] = HIDDEN_COLOR);
        setStateColors(emptyColors);
        return;
    }

    // Ensure mapData.objects.states exists before trying to use it with feature()
    const statesObject = mapData.objects.states || mapData.objects[Object.keys(mapData.objects)[0]];
    if (!statesObject) {
        console.error("Could not find states object in TopoJSON data", mapData.objects);
        return;
    }

    const features = feature(mapData, statesObject).features;
    const initialColors: Record<string, string> = {};
    features.forEach((geo: any) => {
        initialColors[geo.id] = getDisplayColor(geo.id, colorOffset, showAllMapColors, selectedStateIds);
    });
    setStateColors(initialColors);
  }, [mapData, colorOffset, showAllMapColors, selectedStateIds, getDisplayColor]);


  useEffect(() => {
    fetch(US_STATES_TOPOJSON_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMapData(data); // Store the raw TopoJSON object directly
        setLoadingMap(false);
      })
      .catch((error) => {
        console.error("Error fetching map data:", error);
        setMapError(t('ErrorLoadingMapData', 'Failed to load map data. Please try refreshing the page.'));
        setLoadingMap(false);
      });
  }, [t]);

  const updateStateColors = useCallback((newOffset: number, revealAll: boolean, currentSelectedIds: string[]) => {
    if (!mapData || !mapData.objects || !mapData.objects.states) {
        // mapData not yet loaded or doesn't have the expected structure
        return;
    }

    const statesObject = mapData.objects.states || mapData.objects[Object.keys(mapData.objects)[0]];
    if (!statesObject) {
        console.error("Could not find states object in TopoJSON data for updateStateColors", mapData.objects);
        return;
    }

    const features = feature(mapData, statesObject).features;
    const newColors: Record<string, string> = {};
    features.forEach((geo: any) => { // geo.id should be the state FIPS code
        newColors[geo.id] = getDisplayColor(geo.id, newOffset, revealAll, currentSelectedIds);
    });
    setStateColors(newColors);
  }, [mapData, getDisplayColor]);


  const handleStateClick = (geo: any) => { // geo is the geography object from react-simple-maps
    const stateId = geo.id; // Assuming FIPS code is the id
    if (!PARTICIPATING_STATE_IDS.includes(stateId)) {
        // If clicked state is not part of the ZKP demo, reset selections
        setSelectedStateIds([]);
        setShowAllMapColors(false); // Hide all colors
        updateStateColors(colorOffset, false, []);
        return;
    }

    let newSelectedIds = [...selectedStateIds];
    if (newSelectedIds.includes(stateId)) {
      newSelectedIds = newSelectedIds.filter(id => id !== stateId); // Toggle off
    } else {
      if (newSelectedIds.length >= 2) {
        newSelectedIds.shift(); // Keep only last 2 selected
      }
      newSelectedIds.push(stateId);
    }

    setSelectedStateIds(newSelectedIds);
    setShowAllMapColors(false); // Important: clicking states hides the "all colors" view
    updateStateColors(colorOffset, false, newSelectedIds);
  };

  const handleShowColorsToggle = () => {
    const newShowAll = !showAllMapColors;
    setShowAllMapColors(newShowAll);
    if (newShowAll) {
      setSelectedStateIds([]); // Clear individual selections when showing all
    }
    updateStateColors(colorOffset, newShowAll, newShowAll ? PARTICIPATING_STATE_IDS : selectedStateIds);
  };

  const handleShuffleColors = () => {
    // Ensure offset changes meaningfully and covers all possibilities if palette is small
    const newOffset = (colorOffset + 1 + Math.floor(Math.random() * (COLOR_PALETTE.length -1))) % COLOR_PALETTE.length;
    setColorOffset(newOffset);
    // updateStateColors will be called by the useEffect watching colorOffset if mapData is present
    // Or, call it directly:
    updateStateColors(newOffset, showAllMapColors, showAllMapColors ? PARTICIPATING_STATE_IDS : selectedStateIds);
  };

  return (
    <>
      <Head>
        <title>{String(t('ZeroKnowledgeProof', 'Zero Knowledge Proof'))} - {String(t('Blockchain Demo'))}</title>
        <meta name="description" content={String(t('ZKPPageMetaDescription', 'Learn about Zero-Knowledge Proofs with an interactive map coloring example.'))} />
      </Head>
      <div>
        <h1>{t('ZeroKnowledgeProofPageTitle', 'Zero-Knowledge Proof: Map Coloring Problem')}</h1>
        <p>{t('ZKPPageDescription', 'This page demonstrates a simplified Zero-Knowledge Proof using map 3-coloring. The Prover (this system) knows a valid 3-coloring for a subset of US states. It will try to convince you (the Verifier) of this knowledge without revealing the entire coloring scheme at once.')}</p>
        <p>{t('ZKPInstructions', 'Instructions: Click on up to two states to reveal their (permuted) colors. If they are adjacent and part of the demo, they should have different colors. "Shuffle Colors" changes the permutation. "Show/Hide Colors" reveals or hides the coloring for all participating states.')}</p>

        <Row gutter={[16, 16]} justify="center" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <Col xs={24} md={18} lg={16}>
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '10px', minHeight: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
              {loadingMap && <Spin tip={t('LoadingMap', "Loading map...")} size="large" />}
              {mapError && !loadingMap && <Alert message={mapError} type="error" showIcon />}
              {!loadingMap && !mapError && mapData && (
                <ComposableMap
                  projection="geoAlbersUsa"
                  style={{ width: '100%', height: 'auto', maxHeight: '500px' }}
                  projectionConfig={{ scale: 1000 }}
                >
                  <Geographies geography={mapData} >
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const stateId = geo.id; // FIPS code
                        const isSelected = selectedStateIds.includes(stateId);
                        const isParticipating = PARTICIPATING_STATE_IDS.includes(stateId);

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={stateColors[stateId] || HIDDEN_COLOR}
                            stroke={isSelected ? SELECTED_BORDER_COLOR : BORDER_COLOR}
                            strokeWidth={isSelected ? 2 : 0.5}
                            onClick={() => handleStateClick(geo)}
                            style={{
                              default: { outline: 'none', transition: 'fill 0.2s ease' },
                              hover: { outline: 'none', fill: isParticipating ? COLOR_PALETTE[0] : '#CCC' , opacity: 0.7 }, // Simple hover
                              pressed: { outline: 'none', fill: isParticipating ? COLOR_PALETTE[1] : '#BBB' },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ComposableMap>
              )}
            </div>
          </Col>
        </Row>
        <Row justify="center" style={{marginBottom: "10px"}}>
            <Col>
                <Text>{t('SelectedStates', 'Selected States (up to 2 relevant for ZKP check):')} {selectedStateIds.join(', ')}</Text>
            </Col>
        </Row>
        <Row justify="center">
          <Col>
            <Space wrap>
              <Button type="primary" onClick={handleShowColorsToggle}>
                {showAllMapColors ? t('HideAllColorsButton', 'Hide All Colors') : t('ShowAllColorsButton', 'Show All Colors')}
              </Button>
              <Button onClick={handleShuffleColors} disabled={!showAllMapColors && selectedStateIds.length === 0}>
                {t('ShuffleColorsButton', 'Shuffle Colors')}
              </Button>
            </Space>
          </Col>
        </Row>
        <Row justify="center" style={{marginTop: "20px"}}>
            <Col>
                <Alert
                    message={t('ZKPExplanationTitle', 'How this relates to ZKP:')}
                    description={t('ZKPExplanationDescription', 'By repeatedly shuffling and revealing colors of selected adjacent states (or all states), the Prover shows they consistently use different colors for adjacent states according to the 3-coloring rule, without revealing the base coloring scheme directly. Each shuffle is a new "commitment". Revealing selected states is the "challenge-response".')}
                    type="info"
                    showIcon
                />
            </Col>
        </Row>
      </div>
    </>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common', 'zkp'])), // Added 'zkp' for specific terms
  },
});

export default ZeroKnowledgeProofPage;
