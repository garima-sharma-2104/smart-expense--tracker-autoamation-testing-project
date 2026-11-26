import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Container, Row, Col, Form, Button, Alert, Card } from "react-bootstrap";

function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setSubmitting(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      setSubmitting(false);
      return;
    }

    try {
      await register(form.name, form.email, form.password);
      navigate("/expenses");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page auth-page">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="auth-card">
              <Card.Body className="p-4 p-md-5">
                <div className="auth-header">
                  <span className="auth-icon">✨</span>
                  <h2>Create Account</h2>
                  <p>Start tracking your expenses smartly</p>
                </div>

                {error && <Alert variant="danger" className="auth-alert" data-testid="signup-error" role="alert">{error}</Alert>}

                <Form onSubmit={handleSubmit} data-testid="signup-form">
                  <Form.Group className="mb-3" controlId="signupName">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      data-testid="signup-name"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="auth-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="signupEmail">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      data-testid="signup-email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="auth-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="signupPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      data-testid="signup-password"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="auth-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="signupConfirmPassword">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      data-testid="signup-confirm-password"
                      placeholder="Re-enter your password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      className="auth-input"
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    data-testid="signup-submit"
                    className="auth-submit-btn w-100"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </Form>

                <div className="auth-footer">
                  <p>
                    Already have an account?{" "}
                    <Link to="/login" className="auth-link" data-testid="signup-login-link">
                      Sign in
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Signup;
