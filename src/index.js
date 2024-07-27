import '@fortawesome/fontawesome-free/css/all.min.css';
import 'assets/css/nucleo-icons.css';
import 'assets/demo/demo.css';
import 'assets/scss/black-dashboard-react.scss';
import ForestFinder from 'components/ForestFinder/ForestFinder';
import ForestProcessor from 'components/ForestProcessor/ForestProcessor';
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
  <AuthProvider>
    <ThemeContextWrapper>
      <BackgroundColorWrapper>
        <BrowserRouter>
          <Routes>
            <Route
              path="/admin/*"
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
            <Route path="/forest" element={<ForestFinder />} />
            <Route path="/test" element={<ForestProcessor />} />
            <Route path="*" element={<SignIn />} />
          </Routes>
        </BrowserRouter>
      </BackgroundColorWrapper>
    </ThemeContextWrapper>
  </AuthProvider>
);
