import {inngest} from "../client.js"
import User from "../../models/user-model.js"
import { NonRetriableError } from "inngest"
import { sendMail } from "../../utils/nodemailer.js"

//fn for triggering sending mail to user when signedup
export const onUserSignup = inngest.createFunction(
     //we can add the content id,event as we needed
     {id:"on-user-signup",retries: 3}, //id is the unique id of this function, retries are the no.of retry we allow for this fn
      {event: "user/signup"}, //means, this is the event to be triggered for the fn below to be executed, ie, can give any name as needed,
      //on triggering this event , the below fn would execute
      async ({event,step}) => { //this is through where we executes all the fns as per the events occured
        //we can include as many steps as we like
        try{
            const {email} = event.data //receives data via the event (we would pass it on calling the event)

            //VV IMP: in an event we can add various steps ie, like a promise, after ones execution, executes next.
            //first step would be to verify if the user is present in the db
           //we have added const user= here because we may return something, else no need
           //we can give any name inside run(ie, its the unique name of that fn happening there)
            const user = await step.run("get-user-email-from-db",async()=>{
                const userObject = await User.findOne({email})

                if(!userObject){
                  //NonRetriableError means, we cannot retry, if the user not exist in the db, then no use to retry it
                  throw new NonRetriableError("user no longer exists in our db")
                }
                return userObject
            })
               
            //step to send welcome email
            await step.run("send-welcome-email",async() =>{
              const subject = `Welcome to the app`
              const message = `Hi,
              \n\n 
              Thanks for signing up. We are glad to have you onboard!`

              await sendMail(user.email,subject,message)
            })

            //like this, we can create as much steps as we need, based on our use case.
            return {success: true}
        }catch(error){
          //shows if any error in any step
          console.error("Error running step",error.message)
          return {success: false}
        }
      }
)