import React from 'react';
import { Link, NavLink } from 'react-router-dom';
// nodejs library to set properties for components
import { PropTypes } from 'prop-types';

// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from 'perfect-scrollbar';

import Accordion from 'components/Accordion/Accordion';
import HKFilters from 'components/Filters/HKFilters';
import PriceForm from 'components/PriceForm/PriceForm';
import { BackgroundColorContext } from 'contexts/BackgroundColorContext';
import { useEffect } from 'react';
import { Nav } from 'reactstrap';

var ps;

function Sidebar(props) {
  const sidebarRef = React.useRef(null);
  useEffect(() => {
    if (navigator.platform.indexOf('Win') > -1) {
      ps = new PerfectScrollbar(sidebarRef.current, {
        suppressScrollX: true,
        suppressScrollY: false,
      });
    }
    // Specify how to clean up after this effect:
    return function cleanup() {
      if (navigator.platform.indexOf('Win') > -1) {
        ps.destroy();
      }
    };
  });
  const { routes, logo } = props;
  let logoImg = null;
  let logoText = null;
  if (logo !== undefined) {
    if (logo.outterLink !== undefined && logo.outterLink !== '') {
      logoImg = (
        <a
          href={logo.outterLink}
          className="simple-text logo-mini"
          target="_blank"
          onClick={props.toggleSidebar}
          rel="noreferrer"
        >
          <div className="logo-img">
            <img src={logo.imgSrc} alt="SkogApp-logo" />
          </div>
        </a>
      );
      logoText = (
        <a
          href={logo.outterLink}
          className="simple-text logo-normal"
          target="_blank"
          onClick={props.toggleSidebar}
          rel="noreferrer"
        >
          {logo.text}
        </a>
      );
    } else {
      logoImg = (
        <Link
          to={logo.innerLink}
          className="simple-text logo-mini"
          onClick={props.toggleSidebar}
        >
          <div className="logo-img">
            <img src={logo.imgSrc} alt="react-logo" />
          </div>
        </Link>
      );
      logoText = (
        <Link
          to={logo.innerLink}
          className="simple-text logo-normal"
          onClick={props.toggleSidebar}
        >
          {logo.text}
        </Link>
      );
    }
  }
  return (
    <BackgroundColorContext.Consumer>
      {({ color }) => (
        <div className="sidebar" data={color}>
          <div className="sidebar-wrapper" ref={sidebarRef}>
            {logoImg !== null || logoText !== null ? (
              <div className="logo">
                {logoImg}
                {logoText}
              </div>
            ) : null}
            <Nav>
              {routes.map((prop, key) => {
                if (prop.redirect) return null;
                return (
                  <li key={key}>
                    <NavLink
                      to={prop.path}
                      className="nav-link"
                      onClick={props.toggleSidebar}
                    >
                      <i className={prop.icon} />
                      <p>{prop.name}</p>
                    </NavLink>
                    {prop.name === 'Map' && (
                      <>
                        <Accordion
                          id="hk-filters"
                          defaultOpen={true}
                          label="FILTER"
                        >
                          <HKFilters />
                        </Accordion>
                        <Accordion
                          id="user-priser"
                          defaultOpen={true}
                          label="PRISER"
                        >
                          <PriceForm />
                        </Accordion>
                      </>
                    )}
                  </li>
                );
              })}
            </Nav>
          </div>
        </div>
      )}
    </BackgroundColorContext.Consumer>
  );
}

Sidebar.propTypes = {
  // if true, then instead of the routes[i].name, routes[i].rtlName will be rendered
  // insde the links of this component
  routes: PropTypes.arrayOf(PropTypes.object),
  logo: PropTypes.shape({
    // innerLink is for links that will direct the user within the app
    // it will be rendered as <Link to="...">...</Link> tag
    innerLink: PropTypes.string,
    // outterLink is for links that will direct the user outside the app
    // it will be rendered as simple <a href="...">...</a> tag
    outterLink: PropTypes.string,
    // the text of the logo
    text: PropTypes.node,
    // the image src of the logo
    imgSrc: PropTypes.string,
  }),
  toggleSidebar: PropTypes.func, // Add this line to validate toggleSidebar prop
};

export default Sidebar;
