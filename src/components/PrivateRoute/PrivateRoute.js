import LZString from 'lz-string';
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser, setCurrentUser } = useAuth();

  let localUser = null;
  const compressedUserData = localStorage.getItem('currentUser');
  if (compressedUserData) {
    localUser = JSON.parse(LZString.decompressFromUTF16(compressedUserData));
  }

  useEffect(() => {
    if (localUser && !currentUser) {
      setCurrentUser(localUser);
    }
  }, [localUser, currentUser, setCurrentUser]);

  if (!currentUser && !localUser?.uid) {
    return <Navigate to="/signin" />;
  }

  return currentUser ? children : <Navigate to="/signin" />;
};

export default PrivateRoute;

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
