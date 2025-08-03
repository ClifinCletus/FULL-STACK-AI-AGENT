import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { onUserSignup } from "./inngest/functions/on-signup.js";
import { onTicketCreated } from "./inngest/functions/on-ticket-create.js";

import userRoutes from "./routes/user-route.js";
import ticketRoutes from "./routes/ticket-route.js";

const PORT = process.env.PORT || 3004;
const app = express();
app.use(cors()); //actually cors act as a middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", userRoutes);
app.use("/api/tickets", ticketRoutes); //changed the route name

//inngest api to act on the particular fns of inngest
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [onUserSignup, onTicketCreated],
  })
);

//here we have done in a way that it connects to mongodb and if suceess then listens to the app via port
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`server at http://localhost:${PORT}`));
  })
  .catch((err) => console.error("MongoDB error: ", err));
