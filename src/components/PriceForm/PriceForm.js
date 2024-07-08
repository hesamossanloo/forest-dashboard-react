import { useAirtable } from 'contexts/AirtableContext';
import { useAuth } from 'contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import Lottie from 'react-lottie';
import {
  Button,
  Card,
  CardBody,
  FormGroup,
  Input,
  Label,
  UncontrolledTooltip,
} from 'reactstrap';
import { db } from 'services/firebase';
import lottieSuccess from '../../assets/lotties/success.json';

const cardStyle = {
  background: 'transparent',
  boxShadow: 'none',
};
const defaultLottieOptions = {
  loop: false,
  autoplay: true,
  animationData: lottieSuccess,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};
const buttonContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
};

const PriceForm = () => {
  const {
    currentUser,
    userSpeciesPrices,
    updateUserSpeciesPrices,
    authLoading,
  } = useAuth();
  const { airTablePricesCosts, isFetchingAirtableRecords } = useAirtable();
  const [formData, setFormData] = useState(userSpeciesPrices || {});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      setFormData(userSpeciesPrices);
    }
  }, [authLoading, userSpeciesPrices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const formDataZeros = Object.entries(formData).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: value === '' ? 0 : value,
          }),
          {}
        );
        await updateDoc(userDocRef, { prices: formDataZeros });
        await updateUserSpeciesPrices(formDataZeros);
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 1500);
      } catch (error) {
        console.error('Error updating document: ', error);
      }
    }
  };

  const resetForm = async (e) => {
    e.preventDefault();
    if (currentUser && !isFetchingAirtableRecords) {
      try {
        setFormData(airTablePricesCosts);
        await updateUserSpeciesPrices(airTablePricesCosts);
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 1500);
      } catch (error) {
        console.error('Error resetting document: ', error);
      }
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setIsSubmitted(false);
    setFormData((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  if (authLoading || isFetchingAirtableRecords || !formData) {
    return <div>Loading...</div>;
  }

  return (
    <Card style={cardStyle}>
      <CardBody>
        <form style={{ position: 'relative' }}>
          <Label
            id="tommerPriser"
            style={{ marginBottom: '10px', textDecoration: 'underline' }}
          >
            Tømmerpriser:
          </Label>
          <FaInfoCircle
            id="tommerPriserTT"
            style={{ cursor: 'pointer', marginLeft: '5' }}
          />
          <UncontrolledTooltip target="tommerPriserTT" delay={0}>
            <u>
              <b>{'Tooltip Label for Tømmerpriser'}</b>
            </u>
            <span>
              <br />
            </span>
            {'Tooltip Content for Tømmerpriser'}
          </UncontrolledTooltip>
          <FormGroup>
            <Label for="granSagtommerPrice">Gran - Sagtømmer</Label>
            <Input
              name="granSagtommerPrice"
              id="granSagtommerPrice"
              placeholder="e.g. 769"
              style={{ fontSize: '14px' }}
              value={formData.granSagtommerPrice || ''}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label for="granMassevirkePrice">Gran - Massevirke</Label>
            <Input
              name="gran-massevirke"
              id="granMassevirkePrice"
              placeholder="e.g. 602"
              style={{ fontSize: '14px' }}
              value={formData.granMassevirkePrice || ''}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label for="furuSagtommerPrice">Furu - Sagtømmer</Label>
            <Input
              name="furu-sagtommer"
              id="furuSagtommerPrice"
              placeholder="e.g. 740"
              style={{ fontSize: '14px' }}
              value={formData.furuSagtommerPrice || ''}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label for="furuMassevirkePrice">Furu - Massevirke</Label>
            <Input
              name="furu-massevirke"
              id="furuMassevirkePrice"
              placeholder="e.g. 586"
              style={{ fontSize: '14px' }}
              value={formData.furuMassevirkePrice || ''}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label for="lauvMassevirkePrice">Bjørk - Sams</Label>
            <Input
              name="lauv-massevirke"
              id="lauvMassevirkePrice"
              placeholder="e.g. 586"
              style={{ fontSize: '14px' }}
              value={formData.lauvMassevirkePrice || ''}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label
              id="driftskostnad"
              style={{ marginBottom: '10px', textDecoration: 'underline' }}
            >
              Driftskostnad:
            </Label>
            <FaInfoCircle
              id="driftskostnadTT"
              style={{ cursor: 'pointer', marginLeft: '5' }}
            />
            <UncontrolledTooltip target="driftskostnadTT" delay={0}>
              <u>
                <b>{'Tooltip Label for Driftskostnad'}</b>
              </u>
              <span>
                <br />
              </span>
              {'Tooltip Content for Driftskostnad'}
            </UncontrolledTooltip>
            <Label for="hogstUtkPrice">Hogst & utkjøring Per m^3:</Label>
            <Input
              name="hogst-utk"
              id="hogstUtkPrice"
              placeholder="e.g. 586"
              style={{ fontSize: '14px' }}
              value={formData.hogstUtkPrice || ''}
              onChange={handleChange}
            />
          </FormGroup>
          <div style={buttonContainerStyle}>
            <Button
              color="primary"
              style={{ fontSize: '12px', padding: '8px' }}
              onClick={handleSubmit}
            >
              Submit
            </Button>
            <Button
              color="primary"
              style={{ fontSize: '12px', padding: '8px' }}
              onClick={resetForm}
            >
              Tilbakestill
            </Button>
          </div>
          {isSubmitted && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000, // Ensure it's above other elements
              }}
            >
              <Lottie options={defaultLottieOptions} height={40} width={40} />
            </div>
          )}
        </form>
      </CardBody>
    </Card>
  );
};

export default PriceForm;
