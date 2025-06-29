import React from 'react';
import { Form, Button, Card } from 'react-bootstrap';

function Register() {

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Register form submitted (not yet functional)');
    // would typically send data to your backend to create a new user
  };

  return (
    <Card className="p-4 mt-5" style={{ maxWidth: '400px', margin: 'auto' }}>
      <h2 className="text-center mb-4">Register</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formBasicUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control type="text" placeholder="Enter username" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control type="email" placeholder="Enter email" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" placeholder="Password" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formConfirmPassword">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control type="password" placeholder="Confirm Password" />
        </Form.Group>

        {/* User Type Selection (e.g., radio buttons or dropdown) */}
        <Form.Group className="mb-3">
          <Form.Label>Register as:</Form.Label>
          <div>
            <Form.Check
              inline
              label="Client"
              name="userType"
              type="radio"
              id="userTypeClient"
              value="client"
            />
            <Form.Check
              inline
              label="Freelancer"
              name="userType"
              type="radio"
              id="userTypeFreelancer"
              value="freelancer"
            />
          </div>
        </Form.Group>

        <Button variant="success" type="submit" className="w-100">
          Register
        </Button>
      </Form>
    </Card>
  );
}

export default Register;