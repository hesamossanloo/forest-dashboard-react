import { useAuth } from 'contexts/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import Lottie from 'react-lottie';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  Input,
  Label,
  Modal,
  ModalFooter,
} from 'reactstrap';
import lottieSuccess from '../../assets/lotties/success.json';
import './ForestFinder.css';

const defaultLottieOptions = {
  loop: false,
  autoplay: true,
  animationData: lottieSuccess,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};

// eslint-disable-next-line react/prop-types
const MapComponent = ({ geoJson }) => {
  const map = useMap();

  useEffect(() => {
    if (geoJson) {
      const geoJsonLayer = L.geoJSON(geoJson).addTo(map);
      map.flyToBounds(geoJsonLayer.getBounds());
    }
  }, [geoJson, map]);

  return null;
};

const ForestFinder = () => {
  const navigate = useNavigate();
  const [requestSent, setRequestSent] = useState(false);
  const { currentUser, updateFBUser, logout } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [kommunenummer, setKommunenummer] = useState('');
  const [matrikkelnummer, setMatrikkelnummer] = useState('');
  const [error, setError] = useState('');
  const [geoJson, setGeoJson] = useState(null);

  const [show, setShow] = useState(false);
  // if user is not logged in redirect to sigin page
  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!localUser?.uid) {
      navigate('/signin');
    } else if (localUser?.FBUser?.forest?.vector) {
      navigate('/cut');
    } else {
      setShow(true);
    }
  }, [navigate]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const findMyForest = () => {
    // check if the matrikkelnummer is in 163/2 format
    const matrikkelnummerRegex = /^\d{1,4}\/\d{1,3}$/;
    if (!matrikkelnummerRegex.test(matrikkelnummer)) {
      setError('Gårds/bruksnummer should be in 163/2 format');
      return;
    }
    if (kommunenummer === '' || matrikkelnummer === '') {
      setError('Please enter Kommunenummer and Gårds/bruksnummer');
      return;
    } else {
      setError('');
      setIsLoading(true);
      fetch(
        'https://sktkye0v17.execute-api.eu-north-1.amazonaws.com/Prod/find',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: {
              forestID: currentUser.uid,
              kommunenummer,
              matrikkelnummertekst: [matrikkelnummer],
            },
          }),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          const geoJsonData = data.forest_geojson;
          setGeoJson(geoJsonData);
          setIsSubmitted(true);
          setIsLoading(false);
          setTimeout(() => {
            setIsSubmitted(false);
            setModalOpen(true);
          }, 1500);
        })
        .catch((error) => {
          setIsLoading(false);
          setIsSubmitted(false);
          console.error('Error:', error);
        });
    }
  };

  const handleForestConfirm = async () => {
    if (requestSent) {
      console.log('Request already sent. So not sending again!');
      return; // Prevent multiple requests
    }

    setIsLoading(true);
    if (!currentUser) {
      setIsLoading(false);
      await logout();
      return;
    }
    try {
      await updateFBUser({
        ...currentUser.FBUser,
        forest: { teig: JSON.stringify(geoJson) },
      });
      setIsLoading(false);
      setRequestSent(true); // Mark the request as sent
      fetch(
        'https://sktkye0v17.execute-api.eu-north-1.amazonaws.com/Prod/cut',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(geoJson),
        }
      );
      navigate('/cut');
    } catch (error) {
      setIsLoading(false);
      console.error('Error:', error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      findMyForest();
    }
  };

  if (!show) {
    return null;
  }
  return (
    <div className="forestFinderContainer">
      <h1>STEP 1/6: Find Your Forest</h1>
      <div>
        <Label>Enter your Kommunenummer:</Label>
      </div>
      <div className="input-group">
        <Input
          type="text"
          value={kommunenummer}
          placeholder="e.g. 3126"
          onChange={(e) => setKommunenummer(e.target.value)}
        />
      </div>
      <div style={{ marginTop: 10 }}>
        <Label>Enter your Gårds/bruksnummer:</Label>
      </div>
      <div className="input-group">
        <Input
          type="text"
          value={matrikkelnummer}
          placeholder="e.g. 163/2"
          onChange={(e) => setMatrikkelnummer(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <Card style={{ marginBottom: 10, marginTop: 10 }}>
        <CardBody>
          <Link
            to="https://norgeskart.no"
            target="_blank"
            rel="noreferrer noopener"
          >
            If you don&apos;t know your Kommunenummer or Gårds- og bruksnummer
            please go to this website and find the information under &quot;SE
            EIENDOMSINFORMASJON&quot; section
          </Link>
        </CardBody>
      </Card>
      <Button onClick={findMyForest} style={{ marginBottom: 15 }}>
        Find My Forest
      </Button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div className="mapContainer">
        <MapContainer center={[59.9139, 10.7522]} zoom={13}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapComponent geoJson={geoJson} /> {/* Use the new component here */}
        </MapContainer>
      </div>
      {isLoading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
      {isSubmitted && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000, // Ensure it's above other elements
          }}
        >
          <Lottie options={defaultLottieOptions} height={40} width={40} />
        </div>
      )}
      {modalOpen && (
        <Modal isOpen={modalOpen} toggle={toggleModal}>
          <div className="modal-header">
            <h2 className="modal-title" id="exampleModalLabel">
              Is This your Forest?
            </h2>
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-hidden="true"
              onClick={toggleModal}
            >
              <i className="tim-icons icon-simple-remove" />
            </button>
          </div>
          <ModalFooter>
            <Button color="danger" onClick={toggleModal}>
              No
            </Button>
            <Button color="success" onClick={handleForestConfirm}>
              Yes
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};

export default ForestFinder;
