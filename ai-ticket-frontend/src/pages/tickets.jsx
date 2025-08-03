import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Tickets() {
  const [form, setForm] = useState({ title: "", description: "" });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  const token = localStorage.getItem("token"); //jwt token(stored in local storage)

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
        method: "GET",
      });
      const data = await res.json();
      //console.log("Tickets from DB:", JSON.stringify(data, null, 2));

      if (res.ok) {
        setTickets(data.tickets || []);
      } else {
        console.error("Error fetching tickets:", data.message);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const details = localStorage.getItem("user");
      if (details) {
        const parsedDetails = JSON.parse(details);
        setUserDetails(parsedDetails); // Use setState
        console.log("User details:", parsedDetails);
      }
    } catch (err) {
      console.error("Failed to parse user details:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchUserDetails();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setForm({ title: "", description: "" });
        fetchTickets(); // Refresh list
      } else {
        alert(data.message || "Ticket creation failed");
      }
    } catch (err) {
      alert("Error creating ticket: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {userDetails?.role !== "admin" && (
        <>
          <h2 className="text-2xl font-bold mb-4">Create Ticket</h2>
          <form onSubmit={handleSubmit} className="space-y-3 mb-8">
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ticket Title"
              className="input input-bordered w-full"
              required
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Ticket Description"
              className="textarea textarea-bordered w-full"
              required
            ></textarea>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </>
      )}

      <h2 className="text-xl font-semibold mb-6">
        All Tickets created by Users
      </h2>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <Link
            key={ticket._id}
            className="card shadow-md p-4 bg-gray-800"
            to={`/tickets/${ticket._id}`}
          >
            <h3 className="font-bold text-lg">{ticket.title}</h3>
            <p className="text-sm">{ticket.description}</p>
            <p className="text-sm text-gray-500">
              Created At: {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </Link>
        ))}
        {tickets.length === 0 && <p>No tickets submitted yet.</p>}
      </div>
    </div>
  );
}
