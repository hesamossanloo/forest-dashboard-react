import emailjs from '@emailjs/browser';
import { useEffect, useState } from 'react';
import Lottie from 'react-lottie';
import { Button, Container, Form, FormGroup, Input, Label } from 'reactstrap';
import lottieSuccess from '../../assets/lotties/success.json';

const defaultLottieOptions = {
  loop: false,
  autoplay: true,
  animationData: lottieSuccess,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};

const FeedbackForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    anonymous: false,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => emailjs.init(process.env.REACT_APP_EMAIL_JS_PUBLIC_KEY), []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    const serviceId = process.env.REACT_APP_EMAIL_JS_SERVICE_ID;
    const templateId = process.env.REACT_APP_EMAIL_JS_TEMPLATE_ID;
    try {
      setIsSubmitted(false);
      const username = formData.anonymous ? 'Anonymous' : formData.name;
      const useremail = formData.anonymous ? 'Anonymous' : formData.email;
      await emailjs.send(serviceId, templateId, {
        username,
        useremail,
        message: formData.message,
      });
      setIsSubmitted(true);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Container>
      <h2>Feedback</h2>
      <Form onSubmit={sendEmail}>
        <FormGroup check className="mb-3">
          <Label className="form-check-label" check>
            <Input
              className="form-check-input"
              name="anonymous"
              type="checkbox"
              checked={formData.anonymous}
              onChange={handleChange}
            />
            Submit anonymously
            <span className="form-check-sign">
              <span className="check"></span>
            </span>
          </Label>
        </FormGroup>
        {!formData.anonymous && (
          <>
            <FormGroup>
              <Label for="name">Name</Label>
              <Input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required={!formData.anonymous}
              />
            </FormGroup>
            <FormGroup>
              <Label for="email">Email</Label>
              <Input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required={!formData.anonymous}
              />
            </FormGroup>
          </>
        )}
        <FormGroup>
          <Label for="message">Message</Label>
          <Input
            type="textarea"
            name="message"
            id="message"
            value={formData.message}
            onChange={handleChange}
            required
          />
        </FormGroup>
        <Button type="submit" color="primary">
          Submit
        </Button>
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
      </Form>
    </Container>
  );
};

export default FeedbackForm;
