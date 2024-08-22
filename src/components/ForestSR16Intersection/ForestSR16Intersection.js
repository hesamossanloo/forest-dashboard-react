/* eslint-disable react-hooks/exhaustive-deps */
import { useAuth } from 'contexts/AuthContext';
import { useEffect, useState } from 'react';
import './ForestSR16Intersection.scss';

import ForestScene from 'components/ForestScene/ForestScene';
import 'leaflet/dist/leaflet.css';
import { Button, Modal, ModalFooter } from 'reactstrap';

import { useNavigate } from 'react-router-dom';

const ForestSR16Intersection = () => {
  const navigate = useNavigate();

  const [SHPFileExists, setSHPFileExists] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [show, setShow] = useState(false);
  // if user is not logged in redirect to sigin page
  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!localUser?.uid) {
      navigate('/signin');
    } else if (localUser?.FBUser?.forest?.vector) {
      navigate('/admin/map');
    } else {
      setShow(true);
    }
  }, [navigate]);

  useEffect(() => {
    // Check if the file exists every 5 seconds
    const interval = setInterval(async () => {
      if (currentUser) {
        setSHPFileExists(true);
        setModalOpen(true);
      } else {
        clearInterval(interval);
      }
    }, 180000); // Check every 3 minutes

    return () => clearInterval(interval);
  }, [currentUser]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const handleForestConfirm = async () => {
    if (requestSent) {
      console.log('Request already sent. So not sending again!');
      navigate('/model');
    } else {
      setRequestSent(true);
      setIsLoading(true);
      try {
        const requestPayload = JSON.stringify({
          yield_requirement: 0.03,
          forestID: currentUser.uid,
        });
        // Set a timeout for the fetch request
        const fetchWithTimeout = (url, options, timeout = 29000) => {
          return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
              setTimeout(() => {
                reject(new Error('Request timed out'));
                setIsLoading(false);
                navigate('/model');
              }, timeout)
            ),
          ]);
        };
        // Wait for 3 minutes (180,000 milliseconds) before running the fetch request
        // to make sure the previous lambda has upserted all the records onto Airtable
        setTimeout(async () => {
          try {
            await fetchWithTimeout(
              'https://sktkye0v17.execute-api.eu-north-1.amazonaws.com/Prod/model',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: requestPayload,
              }
            );
            setIsLoading(false);
            navigate('/model');
          } catch (error) {
            setRequestSent(false); // Reset the state if there's an error
            setIsLoading(false);
            console.error('Error:', error);
          }
        }, 5000);
      } catch (error) {
        setRequestSent(false); // Reset the state if there's an error
        setIsLoading(false);
        console.error('Error:', error);
      }
    }
  };

  if (!show) {
    return null;
  }
  return (
    <>
      {SHPFileExists && currentUser ? (
        <>
          <div className="title">
            <h1>STEP 5/6 for your Skogbruksplan is done!</h1>
          </div>
        </>
      ) : (
        <>
          <div className="title">
            <h1>
              Step 5/6 Finalizing your forestry plan. Based on the size of your
              forest, this could take up to 6 minutes.
            </h1>
          </div>
          <ForestScene />
        </>
      )}
      {modalOpen && (
        <Modal isOpen={modalOpen} toggle={toggleModal}>
          <div className="modal-header">
            <h2 className="modal-title" id="exampleModalLabel">
              We&apos;re getting closer! Let&apos;s proceed to final step.
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
              No, I hate you
            </Button>
            <Button color="success" onClick={handleForestConfirm}>
              Stop stalling, yes!
            </Button>
          </ModalFooter>
        </Modal>
      )}
      {isLoading && (
        <div className="overlay-spinner">
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default ForestSR16Intersection;
