import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';

try {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: awsExports.aws_user_pools_id,
        userPoolClientId: awsExports.aws_user_pools_web_client_id
      }
    }
  });
} catch (e) {
  console.warn('Amplify config error:', e);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
