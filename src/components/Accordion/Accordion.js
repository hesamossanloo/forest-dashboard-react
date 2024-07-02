import PropTypes from 'prop-types';
import { Button, Card, CardBody, UncontrolledCollapse } from 'reactstrap';

const cardStyle = {
  background: 'transparent',
  boxShadow: 'none',
};

const Accordion = ({ id, defaultOpen, label, children }) => {
  // Use the provided `id` to generate unique IDs for the toggler and collapse components
  const togglerId = `linkToggler-${id}`;
  return (
    <>
      <Button color="warning" href={`#${id}`} id={togglerId}>
        {label}
      </Button>
      <UncontrolledCollapse toggler={`#${togglerId}`} defaultOpen={defaultOpen}>
        <Card style={cardStyle}>
          <CardBody>{children}</CardBody>
        </Card>
      </UncontrolledCollapse>
      <style>
        {`
        .card label {
            margin-bottom: 0;
        }
        .card .card-body {
            padding: 10px 5px 0px 10px;
        }
      `}
      </style>
    </>
  );
};

Accordion.propTypes = {
  id: PropTypes.string.isRequired,
  defaultOpen: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default Accordion;
