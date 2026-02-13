import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";

// Pages
import Login from "./pages/login";
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";
import TaskWorkScreen from "./pages/Employee/TaskWorkScreen";
import HRDashboard from "./pages/Hr/HrDashboard";
import Clients from "./pages/Hr/Clients";
import Tasks from "./pages/Hr/Tasks";
import Queries from "./pages/Hr/Queries";
import DayEndReview from "./pages/Hr/DayEndReview";
import Billing from "./pages/Hr/Billing";
import Payments from "./pages/Hr/Payments";
import Ledger from "./pages/Hr/Ledger";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Employee Routes */}
          <Route
            path="/employee/dashboard"
            element={
              <PrivateRoute role="EMPLOYEE">
                <Layout>
                  <EmployeeDashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/work"
            element={
              <PrivateRoute role="EMPLOYEE">
                <Layout>
                  <TaskWorkScreen />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* HR Routes */}
          <Route
            path="/hr/dashboard"
            element={
              <PrivateRoute role="HR">
                <Layout>
                  <HRDashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/hr/clients"
            element={
              <PrivateRoute role="HR">
                <Layout>
                  <Clients />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/hr/tasks"
            element={
              <PrivateRoute role="HR">
                <Layout>
                  <Tasks />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/hr/queries"
            element={
              <PrivateRoute role="HR">
                <Layout>
                  <Queries />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/hr/review"
            element={
              <PrivateRoute role="HR">
                <Layout>
                  <DayEndReview />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/hr/billing"
            element={
              <PrivateRoute role="HR">
                <Layout>
                  <Billing />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/hr/payments"
            element={
              <PrivateRoute role="HR">
                <Layout>
                  <Payments />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/hr/ledger"
            element={
              <PrivateRoute role="HR">
                <Layout>
                  <Ledger />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
