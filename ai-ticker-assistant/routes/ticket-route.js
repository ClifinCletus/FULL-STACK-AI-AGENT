import express from "express"
import { authenticate } from "../middlewares/auth"
import { createTicket, getTicket, getTickets } from "../controllers/ticket.js"
const router = express.Router()

router.get("/",authenticate, getTickets) //the home page to get all tickets
router.get("/:id",authenticate,getTicket)
router.post("/",authenticate, createTicket)


export default router