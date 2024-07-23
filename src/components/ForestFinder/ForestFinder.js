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
  const { currentUser, updateFBUser, logout, authErro } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoaidng, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [kommunenummer, setKommunenummer] = useState('3226');
  const [matrikkelnummer, setMatrikkelnummer] = useState(
    '167/1, 167/49, 167/50, 173/1, 173/12'
  );
  const [matrikkelnummerList, setMatrikkelnummerList] = useState([]);
  const [kommunenummerList, setKommunenummerList] = useState([]);
  const [error, setError] = useState('');
  const [geoJson, setGeoJson] = useState(null);

  // if udrt is not logged in go to sigin page
  useEffect(() => {
    if (
      currentUser &&
      currentUser.FBUser &&
      currentUser.FBUser.forests &&
      !authErro
    ) {
      navigate('/admin/map');
    }
    if (!currentUser) {
      navigate('/signin');
    }
  }, [currentUser, navigate, authErro]);

  const addKommunenummer = () => {
    if (kommunenummer) {
      const kommunenummerArray = kommunenummer
        .split(',')
        .map((item) => item.trim());
      setKommunenummerList([...kommunenummerList, ...kommunenummerArray]);
      setKommunenummer('');
    }
  };
  const addMatrikkelnummer = () => {
    if (matrikkelnummer) {
      const matrikkelnummerArray = matrikkelnummer
        .split(',')
        .map((item) => item.trim());
      setMatrikkelnummerList([...matrikkelnummerList, ...matrikkelnummerArray]);
      setMatrikkelnummer('');
    }
  };

  const removeKommunenummer = (index) => {
    const newKommunenummerList = [...kommunenummerList];
    newKommunenummerList.splice(index, 1);
    setKommunenummerList(newKommunenummerList);
  };

  const removeMatrikkelnummer = (index) => {
    const newMatrikkelnummerList = [...matrikkelnummerList];
    newMatrikkelnummerList.splice(index, 1);
    setMatrikkelnummerList(newMatrikkelnummerList);
  };

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };
  const findMyForest = () => {
    if (kommunenummerList.length === 0 || matrikkelnummerList.length === 0) {
      setError(
        'Please enter at least one value for Kommunenummer and Matrikkelnummer'
      );
    } else {
      setError('');
      setIsLoading(true);
      fetch(
        'https://kjpbus56uh.execute-api.eu-north-1.amazonaws.com/dev/filter',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: {
              kommunenummer: kommunenummerList[0],
              matrikkelnummertekst: matrikkelnummerList.flat(),
            },
          }),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          const geoJsonData = data.filtered_features;
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
    setIsLoading(true);
    if (!currentUser || !currentUser.FBUser) {
      setIsLoading(false);
      await logout();
      return;
    }
    try {
      await updateFBUser({
        ...currentUser.FBUser,
        forests: [JSON.stringify(geoJson)],
      });
      setIsLoading(false);
      navigate('/admin/map');
    } catch (error) {
      setIsLoading(false);
      console.error('Error:', error);
    }
  };

  return (
    <div className="forestFinderContainer">
      <h1>Find Your Forest</h1>
      <div>
        <Label>Enter your Kommunenummer:</Label>
      </div>
      <div className="input-group">
        <Input
          type="text"
          value={kommunenummer}
          onChange={(e) => setKommunenummer(e.target.value)}
        />
        <Button onClick={addKommunenummer}>Add</Button>
      </div>
      {kommunenummerList.map((kommunenummer, index) => (
        <div key={index} className="tag">
          <span>{kommunenummer}</span>
          <Button onClick={() => removeKommunenummer(index)}>X</Button>
        </div>
      ))}
      <div style={{ marginTop: 10 }}>
        <Label>Enter your Matrikkelnummer:</Label>
      </div>
      <div className="input-group">
        <Input
          type="text"
          value={matrikkelnummer}
          onChange={(e) => setMatrikkelnummer(e.target.value)}
        />
        <Button onClick={addMatrikkelnummer}>Add</Button>
      </div>
      {matrikkelnummerList.map((m, index) => (
        <div key={index} className="tag">
          <span>{m}</span>
          <Button onClick={() => removeMatrikkelnummer(index)}>X</Button>
        </div>
      ))}
      <Card style={{ marginBottom: 10, marginTop: 10 }}>
        <CardBody>
          <Link
            to="https://gardskart.nibio.no/landbrukseiendom/3226/167/1/0?gardskartlayer=ar5kl7"
            target="_blank"
            rel="noreferrer noopener"
          >
            If you don&apos;t know your Kommunenummer or Matrikkelnummer please
            go to this website to find it.
          </Link>
        </CardBody>
      </Card>
      <Button onClick={findMyForest} style={{ marginBottom: 15 }}>
        Find My Forest
      </Button>
      {error && <div>{error}</div>}
      <div className="mapContainer">
        <MapContainer center={[59.9139, 10.7522]} zoom={13}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapComponent geoJson={geoJson} /> {/* Use the new component here */}
        </MapContainer>
      </div>
      {isLoaidng && (
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
