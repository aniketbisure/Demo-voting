'use server'

import fs from 'fs';
import path from 'path';
import { redirect } from 'next/navigation';

const dataFilePath = path.join(process.cwd(), 'src/data/polls.json');

export async function createPoll(formData: FormData) {
    const title = formData.get('title') as string;
    const subTitle = formData.get('subTitle') as string;
    const partyName = formData.get('partyName') as string;
    const votingDateRaw = formData.get('votingDate') as string;
    const blueInfoText = (formData.get('blueInfoText') as string) || "डेमो मतदानासाठी खालील यादीतील निर्णय घेतला आहे कृपया दाबा";
    const yellowTitleText = (formData.get('yellowTitleText') as string) || `मतदानाच्या दिवशी सुद्धा "${partyName}" पक्षाचे लोकप्रिय उमेदवार`;
    const yellowFooterText = (formData.get('yellowFooterText') as string) || "यांना त्यांच्या नाव व चिन्हासमोरील बटन दाबून प्रचंड मताने विजयी करा!";


    // Handle File Upload
    const symbolFile = formData.get('mainSymbolFile') as File;
    let mainSymbolUrl = '';

    if (symbolFile && symbolFile.name) {
        const bytes = await symbolFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${Date.now()}_${symbolFile.name}`;
        const uploadDir = path.join(process.cwd(), 'public/uploads');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        mainSymbolUrl = `/uploads/${fileName}`;
    }

    // Format Date: YYYY-MM-DD -> मतदान दि.- DD/MM/YYYY
    let votingDate = votingDateRaw;
    if (votingDateRaw) {
        const [year, month, day] = votingDateRaw.split('-');
        votingDate = `मतदान दि.- ${day}/${month}/${year} रोजी स. ७ ते सायं. ६ पर्यंत`;
    }

    // Parse candidates from form data
    const candidates = [];
    let i = 0;
    while (formData.has(`candidateName_${i}`)) {
        const name = formData.get(`candidateName_${i}`) as string;
        const seat = formData.get(`candidateSeat_${i}`) as string;
        const serialNumber = formData.get(`candidateSr_${i}`) as string;

        if (name) {
            candidates.push({
                seat: seat || `जागा ${i + 1}`,
                name,
                serialNumber: serialNumber || (i + 1).toString(),
                symbolUrl: mainSymbolUrl,
                bgColor: '#fff'
            });
        }
        i++;
    }

    const id = Math.random().toString(36).substring(7).toUpperCase();

    const newPoll = {
        id,
        title,
        subTitle,
        partyName,
        mainSymbolUrl,
        ogImage: mainSymbolUrl,
        votingDate,
        blueInfoText,
        yellowTitleText,
        yellowFooterText,
        candidates
    };

    const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
    const polls = JSON.parse(fileContent);
    polls.push(newPoll);

    fs.writeFileSync(dataFilePath, JSON.stringify(polls, null, 2));

    redirect(`/demo/${id}`);
}



