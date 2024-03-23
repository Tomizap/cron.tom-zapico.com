const {api} = require('@tomizap/tools')
const { google } = require("googleapis");

const google_refresh_token = "1//039SrQdMLdNA9CgYIARAAGAMSNwF-L9IrHQztUaxZ04aM9ZlpKSR0oC3_GDgULTAqsrJrigaHesXx1hqIp3d4iYUm9yDp4j_F8Fw"

async function main() {
    const oauth2Client = new google.auth.OAuth2(
        "1077742480191-sel8t74e6ivuu19m9r8h3aar15fd65r1.apps.googleusercontent.com", 
        "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",
        "http://localhost:3000/oauth/google/token"
    );
    await oauth2Client.setCredentials({
        refresh_token: google_refresh_token, 
    });
    api.google.client = {
        calendar: await google.calendar({ version: 'v3', auth: oauth2Client }),
        drive: await google.drive({ version: 'v3', auth: oauth2Client }),
        sheets: await google.sheets({ version: 'v4', auth: oauth2Client }),
        drive: await google.drive({ version: 'v3', auth: oauth2Client }),
        gmail: await google.gmail({ version: 'v1', auth: oauth2Client }),
    }

    // Schedule appointments from Google sreadsheet BDD
    // await api.appointments.schedule

    // Riching companies from Google sreadsheet BDD
    await api.google.spreadsheet.rich(
        "1ru8WO_rx1eV9x5S6I49RfJJdCpeVPkF8WAatVjhEDAw", 
        'COMPANIES'
        )
}
main()

