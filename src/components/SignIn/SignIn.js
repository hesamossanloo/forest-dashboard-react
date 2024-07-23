import { Checkbox, FormControlLabel } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import logo from 'assets/img/favicon.png';
import Copyright from 'components/Copyright/Copyright';
import { useAuth } from 'contexts/AuthContext';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignIn() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const rememberMeRef = useRef();

  const {
    signIn,
    signInWithGoogle,
    authError,
    clearError,
    currentUser,
    authLoading,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && !authError && !authLoading) {
      if (currentUser.FBUser && currentUser.FBUser.forests) {
        navigate('/admin/map'); // Navigate to the dashboard if the user is already signed in
      } else {
        navigate('/test'); // Navigate to the dashboard
      }
    }
    if (!currentUser) {
      navigate('/signin'); // Navigate to the dashboard if the user is already signed in
    }
  }, [currentUser, authError, authLoading, navigate]);

  useEffect(() => {
    // Clear error on component mount or specific events
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await signIn(
      emailRef.current.value,
      passwordRef.current.value,
      rememberMeRef.current.checked
    );
    if (response && response.wasSuccessful && currentUser) {
      if (currentUser.FBUser && currentUser.FBUser.forests) {
        navigate('/admin/map'); // Navigate to the dashboard if the user is already signed in
      } else {
        navigate('/test'); // Navigate to the dashboard
      }
    }
  };

  const handleGoogleSignIn = async () => {
    const response = await signInWithGoogle(rememberMeRef.current.checked);
    if (response && response.wasSuccessful) {
      if (currentUser && currentUser.FBUser && currentUser.FBUser.forests) {
        navigate('/admin/map'); // Navigate to the dashboard if the user is already signed in
      } else {
        navigate('/test'); // Navigate to the dashboard
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'white' }}>
          <div className="logo-img">
            <img src={logo} alt="SkogApp-logo" />
          </div>
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            inputRef={emailRef}
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            inputRef={passwordRef}
          />
          <FormControlLabel
            control={
              <Checkbox
                value="remember"
                color="primary"
                inputRef={rememberMeRef}
              />
            }
            label="Remember me"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            sx={{ mt: 1, mb: 2 }}
            onClick={handleGoogleSignIn}
          >
            Sign In with Google
          </Button>
          <Grid container>
            <Grid item xs>
              <Link href="/forgot-password" variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link href="/signup" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </Box>
        <Grid container sx={{ mt: 5 }}>
          <Grid item xs>
            <Copyright appName="SkogApp" appURL="https://skogapp.no/" />
          </Grid>
          <Grid item>
            {/* Privacy Policy Link */}
            <Link
              href={`${process.env.PUBLIC_URL}/privacy-policy.html`} // Adjust the path if necessary
              target="_blank" // Opens in a new tab
              rel="noopener noreferrer" // For security reasons
              variant="body2"
              style={{ marginLeft: '10px' }} // Add some spacing between Copyright and Privacy Policy
            >
              Privacy Policy
            </Link>
          </Grid>
        </Grid>
      </Box>
      {authError && (
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 5 }}
        >
          {authError}
        </Typography>
      )}
    </Container>
  );
}
