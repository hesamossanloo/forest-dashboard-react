import PropTypes from 'prop-types';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
} from 'reactstrap';

const DDStyle = {
  position: 'absolute',
  top: 75,
  right: 10,
  zIndex: 9999,
};

const ForestSelector = ({ isOpen, toggle, onSelectForest }) => (
  <Dropdown isOpen={isOpen} toggle={toggle} style={DDStyle}>
    <DropdownToggle caret color="info" style={{ padding: 10 }}>
      Choose your Forest
    </DropdownToggle>
    <DropdownMenu>
      <DropdownItem onClick={() => onSelectForest('forest1')}>
        Forest 1
      </DropdownItem>
      <DropdownItem onClick={() => onSelectForest('forest2')}>
        Forest 2
      </DropdownItem>
      <DropdownItem onClick={() => onSelectForest('forest3')}>
        Forest 3
      </DropdownItem>
      <DropdownItem onClick={() => onSelectForest('forest4')}>
        Forest 4
      </DropdownItem>
    </DropdownMenu>
  </Dropdown>
);

ForestSelector.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  onSelectForest: PropTypes.func.isRequired,
};

export default ForestSelector;
