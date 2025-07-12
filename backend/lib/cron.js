import { CronJob } from "cron";
import https from "https"

const cron = new CronJob("* 14 * * * *", () => {
    https
    .get("https://chat-app-deployfile.onrender.com", (res) => {
        if(res.statusCode===200) console.log("GET request sent successfully");
        else console.log("GET request failed", res.statusCode);
    })
    .on("error", (e) => console.error('Error while sending request', e));
});

export default cron;