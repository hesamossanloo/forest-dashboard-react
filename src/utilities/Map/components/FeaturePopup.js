/* eslint-disable react/react-in-jsx-scope */
import PropTypes from 'prop-types';
import { Popup } from 'react-leaflet';

const FeaturePopup = ({ activeFeature, setActiveFeature, activeOverlay }) => {
  if (!activeFeature.properties.teig_best_) {
    const activeOverlayNames = Object.keys(activeOverlay).filter(
      (key) => activeOverlay[key] === true
    );
    return (
      <Popup
        position={[activeFeature.lng, activeFeature.lat]}
        onClose={() => setActiveFeature(null)}
      >
        <h3 style={{ color: 'black', textAlign: 'center' }}>
          {activeOverlayNames[0]}
        </h3>
        <table
          style={{
            border: '1px solid black',
            borderCollapse: 'collapse',
          }}
        >
          <tbody>
            {Object.entries(activeFeature.properties).map(
              ([key, value], index) => (
                <tr key={index} style={{ border: '1px solid black' }}>
                  <td
                    style={{
                      padding: '5px',
                      borderRight: '1px solid black',
                    }}
                  >
                    {key}
                  </td>
                  <td style={{ padding: '5px' }}>{value}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </Popup>
    );
  } else {
    return null;
  }
};

FeaturePopup.propTypes = {
  activeFeature: PropTypes.shape({
    lng: PropTypes.number.isRequired,
    lat: PropTypes.number.isRequired,
    properties: PropTypes.object.isRequired,
  }).isRequired,
  setActiveFeature: PropTypes.func.isRequired,
  activeOverlay: PropTypes.object.isRequired,
};

export default FeaturePopup;
