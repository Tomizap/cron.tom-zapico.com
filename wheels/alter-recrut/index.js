const { api } = require('@tomizap/tools')
const path = require('path');
const fs = require('fs')

const GOOGLE_CLIENT_ID = "1077742480191-sel8t74e6ivuu19m9r8h3aar15fd65r1.apps.googleusercontent.com"
const GOOGLE_CLIENT_SECRET = "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"
const GOOGLE_GMAIL = 'alter.recrut@gmail.com'
const GOOGLE_REFRESH_TOKEN = "1//03qs7_1Z51noHCgYIARAAGAMSNwF-L9Ir-Qj88wiN25t7jT7ypcvfpz8EJw0W9sScw5gEiGa-85-MNsdGmwiiKnowmCPUPCw9FJ8"
const GOOGLE_BDD_ID = "1ru8WO_rx1eV9x5S6I49RfJJdCpeVPkF8WAatVjhEDAw"
const MONGO_URI = "mongodb+srv://tom:jHq13Y2ru1y5Dijb@cluster0.crkabz3.mongodb.net/?retryWrites=true&w=majority"

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: GOOGLE_GMAIL,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: GOOGLE_REFRESH_TOKEN,
    },
  });

let a = async function () {
    var lapIndex = -1
    while (true) {
        lapIndex++
        var time = 0
        const timer = setInterval(() => {time++}, 1000)
        await api.init({
            keys: {
                GOOGLE_CLIENT_ID, 
                GOOGLE_CLIENT_SECRET, 
                GOOGLE_GMAIL, 
                GOOGLE_REFRESH_TOKEN, 
                GOOGLE_BDD_ID,
                MONGO_URI
            }
        })
        console.log(`init done`);
        const appointments = await api.google.spreadsheet.get(GOOGLE_BDD_ID, "APPOINTMENTS")
        const internals = await api.google.spreadsheet.get(GOOGLE_BDD_ID, 'INTERNALS')
        const companies = await api.google.spreadsheet.get(GOOGLE_BDD_ID, "COMPANIES")
        const appliers = await api.google.spreadsheet.get(GOOGLE_BDD_ID, "APPLIERS")
        // console.log(companies);
        const schemas = await api.mongo.exec({collection: 'schemas'})
        console.log(`get data done in ${time} sec`);
        try {
            await Promise.all([
                async function emailing () {
                    console.log('emailing companies');

                    for (const company of companies) {
                        
                        console.log(companies.indexOf(company));

                        var status = company.STATUS

                        if (status.includes('emailing') || status.includes('cv_proposal')) {

                            var emailSentCount = status.split('_')
                            if (emailSentCount.length === 1) {
                                status = emailSentCount
                                emailSentCount = 0
                            } else {
                                if (status.includes('emailing')) {
                                    emailSentCount = parseInt(emailSentCount[1])
                                    status = "emailing"
                                } else {
                                    emailSentCount = parseInt(emailSentCount[2])
                                    status = "cv_proposal"
                                }
                            }
    
                            if (emailSentCount > 2) {
                                await api.google.client.sheets.spreadsheets.values.update({
                                    spreadsheetId: GOOGLE_BDD_ID,
                                    range: "COMPANIES!Y" + (companies.indexOf(company)+2),
                                    valueInputOption: 'RAW',
                                    requestBody: {
                                    values: [["disqualified"]],
                                    },
                                });
                                continue
                            }
                            
                            company.EMAIL = await api.item.clear.email(company.EMAIL)
                            if (company.EMAIL === '') {
                                if (company['RECRUITERS.EMAIL'] !== '') {
                                    company.EMAIL = await api.item.clear.email(company['RECRUITERS.EMAIL'])
                                } else {
                                    await api.google.client.sheets.spreadsheets.values.update({
                                        spreadsheetId: GOOGLE_BDD_ID,
                                        range: "COMPANIES!Y" + (companies.indexOf(company)+2),
                                        valueInputOption: 'RAW',
                                        requestBody: {
                                        values: [["lead"]],
                                        },
                                    });
                                    continue
                                }
                            }
                            if (!api.field.isEmail(company.EMAIL)) {
                                console.log("problem with email: ", company.EMAIL);
                                continue
                            }

                            if (company.EMAIL_DATE !== "") {
                                const parts = company.EMAIL_DATE.split('/');
                                const EMAIL_DATE = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00`)
                                if ((new Date() - EMAIL_DATE) / (1000 * 3600 * 24) < 7) {
                                    continue
                                }
                            }
    
                            var sale = await internals.find(internal => {
                                if (company.SALE !== '' && internal.STATUS === 'in') {
                                    return internal.EMAIL === company.SALE  
                                } else {
                                    return internal.GMAIL === 'zaptom.pr@gmail.com'
                                }
                            })
                            if (typeof sale === 'undefined') {
                                sale = await internals.find(internal => internal.EMAIL === 't.zapico@alter-recrut.fr')
                                await api.google.client.sheets.spreadsheets.values.update({
                                    spreadsheetId: GOOGLE_BDD_ID,
                                    range: `COMPANIES!V${(companies.indexOf(company)+2)}`,
                                    valueInputOption: 'RAW',
                                    requestBody: {
                                    values: [["t.zapico@alter-recrut.fr"]],
                                    },
                                })
                            }
    
                            const mailOptions = {
                                from: `${sale.NAME} <${api.item.clear.email(sale.EMAIL)}>`,
                                to: `${api.item.clear.email(company.EMAIL)}`,
                                subject: "",
                                html: `<p>Bonjour,</p>`,
                                attachments: [],
                            };
        
                            if (status.includes('emailing')) {
                                mailOptions.subject = `Accompagnement gratuit pour recrutement en alternance`
    
                                if (company["JOBS.NAME"] !== "") {
                                    await api.google.client.sheets.spreadsheets.values.update({
                                        spreadsheetId: GOOGLE_BDD_ID,
                                        range: "COMPANIES!Y" + (companies.indexOf(company)+2),
                                        valueInputOption: 'RAW',
                                        requestBody: {
                                        values: [["cv_proposal_0"]],
                                        },
                                    });
                                    continue
                                }
                                
                                if (emailSentCount === 0) {
                                    mailOptions.attachments = [
                                        {
                                            filename: 'Présentation Alter Recrut Entreprise.pdf', // Nom du fichier joint
                                            path: path.join(__dirname, 'files', 'Présentation Alter Recrut Entreprise.pdf') // Chemin relatif du fichier PDF
                                        },
                                    ]
                                    mailOptions.html += `
                                        <p>Je m'appelle ${sale.NAME} et je représante Alter Recrut, un cabinet de recrutement spécialisé dans le placement de candidats en alternance.</p>
                                        <p>Notre mission est de faciliter gratuitement l'intégration de talents qualifiés au sein d'entreprises en voie de développement telle que la vôtre.</p>
                                        <p>Notre collaboration avec divers établissements d'enseignement nous permet de vous présenter un éventail de profils méticuleusement sélectionnés, proches de chez vous et en adéquation avec vos critères de sélection spécifiques et les exigences de votre secteur d'activité.</p>
                                    `
                                } else if (emailSentCount === 1) {
                                    mailOptions.html += `
                                        <p>Je me permets de vous relancer suite à mon précédent message ${company.EMAIL_DATE !== "" ? `datant du ${company.EMAIL_DATE}` : ''} concernant votre recrutement en alternance.</p>
                                        <p>Envisagez-vous de développer votre entreprise par le biais du recrutement en alternance prochainement ?</p>
                                        <p>Nous pouvons sélectionner gratuitement des candidats proches de chez vous, correspondant à vos critères de sélection, avec de l'expérience et qui souhaite évoluer professionnellement au sein de votre secteur d'activités.</p>
                                        <p>Nous accompagnons les candidats à trouver une alternance dans les domaines suivants :</p>
                                        <ul>
                                            <li>Marketing / Communication</li>
                                            <li>Vente / Commerce</li>
                                            <li>Administration / RH / Comptabilité</li>
                                        </ul>
                                    `
                                }
                                mailOptions.html += `
                                    <p style="padding-bottom:30px">Je serais ravi de discuter plus en détail avec vous.</p>
                                    <p><a href="${sale.APPOINTMENT_LINK}" style="text-decoration:none; background:#FFD100; padding: 20px; border-radius:10px; color: black"><b>Prendre rendez-vous</b></a></p>
                                    <p style="padding-top:30px">Je me tiens à votre disposition pour répondre à toutes vos questions concernant le recrutement en alternance.</p>
                                    <p>Cordialement,</p>
                                `
                            
                            } else if (status.includes('cv_proposal')) {
    
                                mailOptions.subject = `Proposition de CV qualifiés pour un poste de ${company["JOBS.NAME"]} en alternance`
        
                                if (company["JOBS.NAME"] === "") {
                                    await api.google.client.sheets.spreadsheets.values.update({
                                        spreadsheetId: GOOGLE_BDD_ID,
                                        range: "COMPANIES!Y" + (companies.indexOf(company)+2),
                                        valueInputOption: 'RAW',
                                        requestBody: {
                                        values: [["emailing_0"]],
                                        },
                                    });
                                    continue
                                }
        
                                const selectedAppliers = await appliers
                                    .filter(applier => 
                                        applier.STATUS === "registered" 
                                        && applier.COUNTY === company.COUNTY
                                        && applier.JOBS.toLowerCase() === company["JOBS.NAME"].toLowerCase()
                                        )
                                    .sort((a, b) => parseInt(b.SCORE || "0") - parseInt(a.SCORE || "0"))
                                    .slice(0, 5)
        
                                if (selectedAppliers.length > 1) 
                                    for (const selectedApplier of selectedAppliers) {
                                        const filename = `${selectedApplier.NAME} CV.pdf`
                                        // console.log(filename);
                                        const abspath =  await path.join(__dirname, "/files/cv/", filename)
                                        // console.log(abspath);
                                        const dest = await fs.createWriteStream(abspath);
                                        // console.log(selectedApplier.CV);
                                        // console.log(selectedApplier.EMAIL);
                                        const fileId = await api.google.extractIdFromUrl(selectedApplier.CV)
                                        // console.log(fileId);
                                        if (typeof fileId === 'undefined') continue
                                        // console.log(fileId);
                                        const response = await api.google.client.drive.files.get(
                                            { fileId, alt: 'media' }, { responseType: 'stream' }
                                        );
                                        // console.log(response);
                                        await response.data.pipe(dest);
                                        mailOptions.attachments.push({ filename, path: abspath })
                                    }
        
                                if (mailOptions.attachments.length > 1) {
                                    mailOptions.html += `
                                        <p>Suite à notre précédent échange, nous avons sélectionné ${selectedAppliers.length} candidats pour votre besoin de recrutement en alternance.</p>
                                        <p>Ils habitent tous dans le ${company.COUNTY} et sont intéressés par l'opportunité de travailler au sein de votre entreprise en tant que ${company["JOBS.NAME"]}.</p>
                                        <p>Vous trouverez en pièce jointe leurs CV. Je vous invite à les contacter afin de prendre connaissance de leur motivation à developper votre activité.</p>
                                        <p>Cordialement,</p>
                                    `
                                } else {
                                    // mailOptions.html = 'pas de CV'
                                    continue
                                }
                                
                            } else {
                                continue
                            }
    
                            mailOptions.html += `
                                <br>
                                ${sale.SIGNATURE}
                            `
    
                            const emailing = await transporter.sendMail(mailOptions)
                            // console.log(emailing);
                            if (emailing.response.includes("OK")) {
                                emailSentCount++
        
                                const date = new Date().toJSON().split('T')[0].split('-')
                                const day = date[2]
                                const month = date[1]
                                const year = date[0]
                                await api.google.client.sheets.spreadsheets.values.update({
                                    spreadsheetId: GOOGLE_BDD_ID,
                                    range: `COMPANIES!W${(companies.indexOf(company)+2)}`,
                                    valueInputOption: 'RAW',
                                    requestBody: {
                                    values: [[`${day}/${month}/${year}`]],
                                    },
                                })
    
                                console.log(`email sent to ${company.EMAIL}`);
                                    // .then(r => console.log(r));
                                
                                await api.google.client.sheets.spreadsheets.values.update({
                                    spreadsheetId: GOOGLE_BDD_ID,
                                    range: "COMPANIES!Y" + (companies.indexOf(company)+2),
                                    valueInputOption: 'RAW',
                                    requestBody: {
                                    values: [[`${status}_${emailSentCount}`]],
                                    },
                                })
                                    // .then(r => console.log(r))
                            } else {
                                console.log(emailing.response);
                            }

                        }
                        
                        // break
                    }
                }(),
                // await api.google.spreadsheet.rich(GOOGLE_BDD_ID, 'COMPANIES'),
                await api.appointments.schedule(appointments)
                // await api.item.import.data(companies, {
                //     map: {
                //         set: {
                //             LAST_CALL_DATE: 'CALL_DATE',
                //             LAST_EMAIL_DATE: 'EMAIL_DATE'
                //         },
                //         delete: [
                //             'JOBS'
                //         ]
                //     },
                //     // ieSelector: ['PHONE'],
                //     schemas
                // }),
                // await api.tools.import.data(appliers, {
                //     map: {
                //         set: {
                //             LAST_CALL_DATE: 'CALL_DATE',
                //             LAST_EMAIL_DATE: 'EMAIL_DATE'
                //         },
                //         delete: [
                //             "RECRUITER", 'JOBS'
                //         ]
                //     },
                //     ieSelector: ['PHONE'],
                //     schemas
                // }),
            ])
        } catch (error) { 
            console.log("ErrorAlterRecrut: ", error);
            clearInterval(timer); 
            await api.close()
            break }
        console.log(`end lap ${lapIndex} of AlterRecrut in ${time} seconds !`);
        clearInterval(timer)
        // await api.close()
        break
    }
}()