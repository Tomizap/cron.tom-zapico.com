const { api } = require('@tomizap/tools')
const path = require('path');

GOOGLE_CLIENT_ID = "1077742480191-sel8t74e6ivuu19m9r8h3aar15fd65r1.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "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"
const { google } = require("googleapis");
const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
const google_refresh_token = "1//039SrQdMLdNA9CgYIARAAGAMSNwF-L9IrHQztUaxZ04aM9ZlpKSR0oC3_GDgULTAqsrJrigaHesXx1hqIp3d4iYUm9yDp4j_F8Fw"
const GOOGLE_BDD_ID = "1ru8WO_rx1eV9x5S6I49RfJJdCpeVPkF8WAatVjhEDAw"
oauth2Client.setCredentials({
    refresh_token: google_refresh_token, 
});
api.google.client = {
    calendar: google.calendar({ version: 'v3', auth: oauth2Client }),
    drive: google.drive({ version: 'v3', auth: oauth2Client }),
    sheets: google.sheets({ version: 'v4', auth: oauth2Client }),
    drive: google.drive({ version: 'v3', auth: oauth2Client }),
    gmail: google.gmail({ version: 'v1', auth: oauth2Client }),
}

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "zaptom.pro@gmail.com",
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: google_refresh_token,
    },
  });

let a = async function run () {
    while (true) {
        try {
            await Promise.all([
                async function emailing () {
                    console.log('emailing()');
                    const companies = await api.google.spreadsheet.get(GOOGLE_BDD_ID, "COMPANIES")
                    
                    for (const company of companies) {
                        if (!(company.STATUS.includes('emailing') || company.STATUS.includes('cv_proposal'))) continue
                        // console.log(company);

                        var emailSentCount = company.STATUS.split('_')
                        if (emailSentCount.length === 1) {
                            emailSentCount = 0
                        } else {
                            emailSentCount = await parseInt(emailSentCount[1])
                        }
                        if (emailSentCount === 3) {
                            await api.google.client.sheets.spreadsheets.values.update({
                                spreadsheetId: GOOGLE_BDD_ID,
                                range: "COMPANIES!R" + (companies.indexOf(company)+2),
                                valueInputOption: 'RAW',
                                requestBody: {
                                values: [["disqualified"]],
                                },
                            });
                            continue
                        }

                        if (company.EMAIL === '') {
                            await api.google.client.sheets.spreadsheets.values.update({
                                spreadsheetId: GOOGLE_BDD_ID,
                                range: "COMPANIES!R" + (companies.indexOf(company)+2),
                                valueInputOption: 'RAW',
                                requestBody: {
                                values: [["lead"]],
                                },
                            });
                            continue
                        }

                        if (company.EMAIL_DATE !== "") {
                            const parts = company.EMAIL_DATE.split('/');
                            const EMAIL_DATE = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00`)
                            console.log('new Date() - EMAIL_DATE', (new Date() - EMAIL_DATE) / (1000 * 3600 * 24));
                            if ((new Date() - EMAIL_DATE) / (1000 * 3600 * 24) < 7) {
                                if (company.STATUS.includes('emailing')) {
                                    await api.google.client.sheets.spreadsheets.values.update({
                                        spreadsheetId: GOOGLE_BDD_ID,
                                        range: "COMPANIES!R" + (companies.indexOf(company)+2),
                                        valueInputOption: 'RAW',
                                        requestBody: {
                                        values: [[`disqualified`]],
                                        },
                                    })
                                } else if (company.STATUS.includes('cv_proposal')) {
                                    await api.google.client.sheets.spreadsheets.values.update({
                                        spreadsheetId: GOOGLE_BDD_ID,
                                        range: "COMPANIES!R" + (companies.indexOf(company)+2),
                                        valueInputOption: 'RAW',
                                        requestBody: {
                                        values: [[`emailing_0`]],
                                        },
                                    })
                                }
                                continue
                            }
                        }

                        if (company.STATUS.includes('emailing') ? company.JOBS !== "" : company.JOBS === "") {
                            await api.google.client.sheets.spreadsheets.values.update({
                                spreadsheetId: GOOGLE_BDD_ID,
                                range: "COMPANIES!R" + (companies.indexOf(company)+2),
                                valueInputOption: 'RAW',
                                requestBody: {
                                values: [[company.STATUS.includes('emailing') ? "cv_proposal" : "emailing"]],
                                },
                            });
                            continue
                        }

                        if (company.STATUS.includes('emailing')) {
                            console.log('emailing');

                            const internals = await api.google.spreadsheet.get(GOOGLE_BDD_ID, 'INTERNALS')
                            // console.log(internals);
                            var sale = await internals.find(internal => {
                                if (company.SALE !== '' && internal.STATUS === 'in') {
                                    return internal.GMAIL === company.SALE  
                                } else {
                                    return internal.GMAIL === 'zaptom.pr@gmail.com'
                                }
                            })
                            if (typeof sale === 'undefined') {
                                sale = internals.find(internal => internal.GMAIL === 'zaptom.pro@gmail.com')
                            }
                            // console.log(sale);
    
                            var message = `
                                <p>Bonjour,</p>
                                <p>Je me permets de vous adresser ce message en tant que ${sale.NAME}, représentant d'Alter Recrut, un cabinet de recrutement de premier plan spécialisé dans le placement de candidats en alternance.</p>
                                <p>Notre mission est de faciliter gratuitement l'intégration de talents qualifiés au sein d'entreprises en voie de développement.</p>
                                <p>Notre collaboration avec divers établissements d'enseignement nous permet de vous présenter un éventail de profils méticuleusement sélectionnés, proches de chez vous et en adéquation avec vos critères de sélection spécifiques et les exigences de votre secteur d'activité.</p>
                                <p style="padding-bottom:30px">Je serais ravi de discuter plus en détail avec vous.</p>
                                <p><a href="${sale.APPOINTMENT_LINK}" style="text-decoration:none; background:#FFD100; padding: 20px; border-radius:10px; color: black"><b>Prendre rendez-vous avec un chargé de recrutement</b></a></p>
                                <p style="padding-top:30px">J'attends avec impatience notre rencontre !</p>
                                <p>Cordialement,</p>
                                <br>
                                ${sale.SIGNATURE}
                            `
    
                            const mailOptions = {
                                from: `Tom ZAPICO <zaptom.pro@gmail.com>`,
                                to: company.EMAIL,
                                subject: "Service d'accompagnement gratuit pour recrutement en alternance",
                                html: message,
                                attachments: [
                                {
                                    filename: 'Présentation Alter Recrut Entreprise.pdf', // Nom du fichier joint
                                    path: path.join(__dirname, 'files', 'Présentation Alter Recrut Entreprise.pdf') // Chemin relatif du fichier PDF
                                },
                                ],
                            };
                            const emailing = await transporter.sendMail(mailOptions)
                            // console.log(emailing);
                            if (emailing.response.includes("ok")) {
                                emailSentCount++
        
                                const date = new Date().toJSON().split('T')[0].split('-')
                                const day = date[2]
                                const month = date[1]
                                const year = date[0]
                                await api.google.client.sheets.spreadsheets.values.update({
                                    spreadsheetId: GOOGLE_BDD_ID,
                                    range: `COMPANIES!O${(companies.indexOf(company)+2)}:R${(companies.indexOf(company)+2)}`,
                                    valueInputOption: 'RAW',
                                    requestBody: {
                                    values: [[sale.GMAIL, `${day}/${month}/${year}`]],
                                    },
                                })
                                    // .then(r => console.log(r));
                                
                                await api.google.client.sheets.spreadsheets.values.update({
                                    spreadsheetId: GOOGLE_BDD_ID,
                                    range: "COMPANIES!R" + (companies.indexOf(company)+2),
                                    valueInputOption: 'RAW',
                                    requestBody: {
                                    values: [[`emailing_${emailSentCount}`]],
                                    },
                                })
                                    .then(r => console.log(r))
                            }
                        } else if (company.STATUS.includes('cv_proposal')) {
                            console.log('cv_proposal');
                            const appliers = await api.google.spreadsheet.get(GOOGLE_BDD_ID, "APPLIERS")
                            // console.log(company);
                            const selectedAppliers = await appliers
                                .filter(applier => 
                                    applier.STATUS === "registered" 
                                    && applier.COUNTY === company.COUNTY
                                    && applier.JOBS.toLowerCase() === company.JOBS.toLowerCase()
                                    )
                                .sort((a, b) => parseInt(b.SCORE || "0") - parseInt(a.SCORE || "0"))
                                .slice(0, 5)
                            console.log('selectedAppliers', selectedAppliers);
                            const mailOptions = {
                                to: `zaptom.pro@gmail.com`,
                                subject: "Proposition de CV",
                                html: ``,
                                attachments: [],
                            };

                            if (selectedAppliers.length > 0) {

                            }

                            if (mailOptions.attachments.length > 0) {
                                mailOptions.html = `
                                    
                                `
                            } else {
                                mailOptions.html = 'pas de CV'
                            }

                            // const mailOptions = {
                            //     to: `Tom ZAPICO <zaptom.pro@gmail.com>`,
                            //     subject: "Proposition de CV ",
                            //     html: ``,
                            //     attachments,
                            // };
                            // const emailing = await transporter.sendMail(mailOptions)
                        }
                        
                        break
                    }
                }(),
                // CV Proposal
                // async function cp_proposal() {
                //     const appliers = await api.google.spreadsheet.get(GOOGLE_BDD_ID, 'APPLIERS')
                //         .then(a => a.STATUS === "inscri")
                //     const companies = await api.google.spreadsheet.get(GOOGLE_BDD_ID, 'COMPANIES')
                //         .then(c => c.STATUS === "cv_proposal")

                //     for (const company of companies) {
                //         if (company.JOBS === '') {
                //             try {
                //                 const range = "APPOINTMENTS!V" + (iAppointment+2)
                //                 await api.google.client.sheets.spreadsheets.values.update({
                //                   spreadsheetId: GOOGLE_BDD_ID,
                //                   range,
                //                   valueInputOption: 'RAW',
                //                   requestBody: {
                //                     values: [["emailing"]],
                //                   },
                //                 });
                //                 // console.log('Cell value updated:', response.data.updatedRange);
                //               } catch (err) {
                //                 console.error('Error updating cell value:', err);
                //               }
                //             continue
                //         }
                //         const selected_appliers = await api.recruit.cv_proposal(company, appliers) 
                //         if (company.EMAIL_DATE !== "") {

                //         }

                //     }

                // },
                // Riching companies from Google sreadsheet BDD
                // await api.google.spreadsheet.rich(GOOGLE_BDD_ID, 'COMPANIES'),
                // Scheduling Google sreadsheet BDD Appointments
                // async function scheduling () {
                //     const appointments = await api.google.spreadsheet.get(GOOGLE_BDD_ID, "APPOINTMENTS")
                //     await api.appointments.schedule(appointments)
                // }()
            ])
        } catch (error) { console.log(error); break }
        break
    }
}()