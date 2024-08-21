// src/layouts/Admin/Admin.js
import logo from 'assets/img/favicon.png';
import Footer from 'components/Footer/Footer.js';
import AdminNavbar from 'components/Navbars/AdminNavbar.js';
import Sidebar from 'components/Sidebar/Sidebar.js';
import { BackgroundColorContext } from 'contexts/BackgroundColorContext';
import PerfectScrollbar from 'perfect-scrollbar';
import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import routes from 'routes.js';

var ps;

function Admin(props) {
  const location = useLocation();
  const mainPanelRef = useRef(null);
  const [sidebarOpened, setsidebarOpened] = useState(
    document.documentElement.className.indexOf('nav-open') !== -1
  );

  useEffect(() => {
    if (navigator.platform.indexOf('Win') > -1) {
      document.documentElement.className += ' perfect-scrollbar-on';
      document.documentElement.classList.remove('perfect-scrollbar-off');
      ps = new PerfectScrollbar(mainPanelRef.current, {
        suppressScrollX: true,
      });
      let tables = document.querySelectorAll('.table-responsive');
      for (let i = 0; i < tables.length; i++) {
        ps = new PerfectScrollbar(tables[i]);
      }
    }
    return function cleanup() {
      if (navigator.platform.indexOf('Win') > -1) {
        ps.destroy();
        document.documentElement.classList.add('perfect-scrollbar-off');
        document.documentElement.classList.remove('perfect-scrollbar-on');
      }
    };
  });

  useEffect(() => {
    if (navigator.platform.indexOf('Win') > -1) {
      let tables = document.querySelectorAll('.table-responsive');
      for (let i = 0; i < tables.length; i++) {
        ps = new PerfectScrollbar(tables[i]);
      }
    }
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    if (mainPanelRef.current) {
      mainPanelRef.current.scrollTop = 0;
    }
  }, [location]);

  const toggleSidebar = () => {
    document.documentElement.classList.toggle('nav-open');
    setsidebarOpened(!sidebarOpened);
  };

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === '/admin') {
        return (
          <Route path={prop.path} element={prop.component} key={key} exact />
        );
      } else {
        return null;
      }
    });
  };

  const getBrandText = (path) => {
    for (let i = 0; i < routes.length; i++) {
      if (location.pathname.indexOf(routes[i].layout + routes[i].path) !== -1) {
        return routes[i].name;
      }
    }
    return 'Brand';
  };

  return (
    <BackgroundColorContext.Consumer>
      {({ color, changeColor }) => (
        <>
          <div className="wrapper">
            <Sidebar
              routes={routes}
              logo={{
                innerLink: '/admin/map',
                text: 'SKOGAPP',
                imgSrc: logo,
              }}
              toggleSidebar={toggleSidebar}
            />
            <div className="main-panel" ref={mainPanelRef} data={color}>
              <AdminNavbar
                brandText={getBrandText(location.pathname)}
                toggleSidebar={toggleSidebar}
                sidebarOpened={sidebarOpened}
              />
              <Routes>
                {getRoutes(routes)}
                <Route
                  path="/"
                  element={<Navigate to="/admin/map" replace />}
                />
              </Routes>
              {location.pathname === '/admin/map' ? null : <Footer fluid />}
            </div>
          </div>
        </>
      )}
    </BackgroundColorContext.Consumer>
  );
}

export default Admin;
