import '@fortawesome/fontawesome-free/css/all.min.css';
import 'assets/scss/black-dashboard-react.scss';
import ForestCut from 'components/ForestCut/ForestCut';
import ForestFeatureInfo from 'components/ForestFeatureInfo/ForestFeatureInfo';
import ForestFinder from 'components/ForestFinder/ForestFinder';
import ForestModel from 'components/ForestModel/ForestModel';
import ForestSR16Intersection from 'components/ForestSR16Intersection/ForestSR16Intersection';
import ForestVectorize from 'components/ForestVectorize/ForestVectorize';
import ForgotPassword from 'components/ForgotPassword/ForgotPassword';
import PrivacyPolicy from 'components/PrivacyPolicy/PrivacyPolicy';
import PrivateRoute from 'components/PrivateRoute/PrivateRoute';
import SignIn from 'components/SignIn/SignIn';
import SignUp from 'components/SignUp/SignUp';
import { AirtableProvider } from 'contexts/AirtableContext';
import { AuthProvider } from 'contexts/AuthContext';
import { MapFilterProvider } from 'contexts/MapFilterContext';
import AdminLayout from 'layouts/Admin/Admin.js';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BackgroundColorWrapper from './components/BackgroundColorWrapper/BackgroundColorWrapper';
import ThemeContextWrapper from './components/ThemeWrapper/ThemeWrapper';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <ThemeContextWrapper>
        <BackgroundColorWrapper>
          <Routes>
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <AirtableProvider>
                    <MapFilterProvider>
                      <AdminLayout />
                    </MapFilterProvider>
                  </AirtableProvider>
                </PrivateRoute>
              }
            />
            <Route path="/privacy-policy.html" element={<PrivacyPolicy />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/find" element={<ForestFinder />} />
            <Route path="/cut" element={<ForestCut />} />
            <Route path="/vectorize" element={<ForestVectorize />} />
            <Route path="/featureInfo" element={<ForestFeatureInfo />} />
            <Route
              path="/SR16Intersection"
              element={<ForestSR16Intersection />}
            />
            <Route path="/model" element={<ForestModel />} />
          </Routes>
        </BackgroundColorWrapper>
      </ThemeContextWrapper>
    </AuthProvider>
  </BrowserRouter>
);
