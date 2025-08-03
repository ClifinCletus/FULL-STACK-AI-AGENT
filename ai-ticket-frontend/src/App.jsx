import { BrowserRouter, Routes, Route } from "react-router-dom";
import TicketDetailsPage from "./pages/ticket";
import Tickets from "./pages/tickets";
import Admin from "./pages/admin";
import Signup from "./pages/signup";
import Login from "./pages/login";
import CheckAuth from "./components/checkAuth";
import Navbar from "./components/navbar";

//checkAuth contains function to check if user is logged in, then only allows to access that page, if false means that no need to login, to access that page
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <CheckAuth protectedRoute={true}>
              <Tickets />
            </CheckAuth>
          }
        />
        <Route
          path="/tickets/:id"
          element={
            <CheckAuth protectedRoute={true}>
              <TicketDetailsPage />
            </CheckAuth>
          }
        />
        <Route
          path="/login"
          element={
            <CheckAuth protectedRoute={false}>
              <Login />
            </CheckAuth>
          }
        />
        <Route
          path="/signup"
          element={
            <CheckAuth protectedRoute={false}>
              <Signup />
            </CheckAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <CheckAuth protectedRoute={true}>
              <Admin />
            </CheckAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
