/* eslint-disable react-hooks/exhaustive-deps */
import { useAuth } from 'contexts/AuthContext';
import { useEffect, useState } from 'react';
import './ForestModel.scss';

import ForestScene from 'components/ForestScene/ForestScene';
import 'leaflet/dist/leaflet.css';
import { Button, Modal, ModalFooter } from 'reactstrap';

import { useNavigate } from 'react-router-dom';

const ForestModel = () => {
  const navigate = useNavigate();

  const [SHPFileExists, setSHPFileExists] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // get the current user uid
  const { currentUser } = useAuth();

  useEffect(() => {
    const interval = setInterval(async () => {
      if (currentUser) {
        setSHPFileExists(true);
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
    navigate('/admin/map');
  };
  return (
    <>
      {SHPFileExists && currentUser ? (
        <>
          <div className="title">
            <h1>STEP 6/6 for your Skogbruksplan is done!</h1>
          </div>
        </>
      ) : (
        <>
          <div className="title">
            <h1>
              Step 6/6 Finalizing your forestry plan. Based on the size of your
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
              So Exciting! Are you ready to see your Forestry plan?
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

export default ForestModel;
