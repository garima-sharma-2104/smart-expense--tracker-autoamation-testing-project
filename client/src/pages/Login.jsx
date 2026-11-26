import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Container, Row, Col, Form, Button, Alert, Card } from "react-bootstrap";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(form.email, form.password);
      navigate("/expenses");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
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
                  <span className="auth-icon">🔐</span>
                  <h2>Welcome Back</h2>
                  <p>Sign in to your expense tracker account</p>
                </div>

                {error && <Alert variant="danger" className="auth-alert" data-testid="login-error" role="alert">{error}</Alert>}

                <Form onSubmit={handleSubmit} data-testid="login-form">
                  <Form.Group className="mb-3" controlId="loginEmail">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      data-testid="login-email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="auth-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="loginPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      data-testid="login-password"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className="auth-input"
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    data-testid="login-submit"
                    className="auth-submit-btn w-100"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </Form>

                <div className="auth-footer">
                  <p>
                    Don't have an account?{" "}
                    <Link to="/signup" className="auth-link" data-testid="login-signup-link">
                      Create one
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

export default Login;
