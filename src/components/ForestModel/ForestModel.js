/* eslint-disable react-hooks/exhaustive-deps */
import { useAuth } from 'contexts/AuthContext';
import { useEffect, useState } from 'react';
import './ForestModel.scss';

import ForestScene from 'components/ForestScene/ForestScene';
import 'leaflet/dist/leaflet.css';
import { Button, Modal, ModalFooter } from 'reactstrap';

import { useNavigate } from 'react-router-dom';

import LZString from 'lz-string';

const ForestModel = () => {
  const navigate = useNavigate();
  const { currentUser, logout, removeForest } = useAuth();

  const [SHPFileExists, setSHPFileExists] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [show, setShow] = useState(false);

  // if user is not logged in redirect to sigin page
  useEffect(() => {
    let localUser = null;
    const compressedUserData = localStorage.getItem('currentUser');
    if (compressedUserData) {
      localUser = JSON.parse(LZString.decompressFromUTF16(compressedUserData));
    }
    if (!localUser?.uid) {
      navigate('/signin');
    } else if (localUser?.FBUser?.forest?.vector) {
      navigate('/admin/map');
    } else {
      setShow(true);
    }
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (currentUser) {
        setSHPFileExists(true);
        setModalOpen(true);
      } else {
        clearInterval(interval);
      }
    }, 240000); // Check every 4 minutes

    return () => clearInterval(interval);
  }, [currentUser]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const handleForestConfirm = async () => {
    navigate('/admin/map');
  };

  const handleLogout = async () => {
    try {
      await removeForest();
      await logout();
    } catch (error) {
      console.error('Error handling logout:', error);
    }
  };

  if (!show) {
    return null;
  }
  return (
    <>
      {SHPFileExists && currentUser ? (
        <>
          <div className="title">STEP 6/6 for your Skogbruksplan is done!</div>
        </>
      ) : (
        <>
          <div className="title">
            Step 6/6 Finalizing your forestry plan. Based on the size of your
            forest, this could take up to 8 minutes.
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Button color="danger" onClick={handleLogout}>
          Cancel
        </Button>
      </div>
    </>
  );
};

export default ForestModel;
