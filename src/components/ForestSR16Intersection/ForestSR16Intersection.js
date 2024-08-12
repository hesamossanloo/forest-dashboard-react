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
              setTimeout(() => reject(new Error('Request timed out')), timeout)
            ),
          ]);
        };
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
        navigate('/model');
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };
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
              forest, this could take up to 5 minutes.
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
    </>
  );
};

export default ForestSR16Intersection;
