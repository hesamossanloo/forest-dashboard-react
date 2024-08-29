/* eslint-disable react/react-in-jsx-scope */

import Map from 'views/Map.js';

var routes = [
  {
    path: '/map',
    name: 'Map',
    rtlName: 'خرائط',
    icon: 'tim-icons icon-map-big',
    component: <Map />,
    layout: '/admin',
  },
];
export default routes;
