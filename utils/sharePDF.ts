import html2pdf from 'html2pdf.js';
import { supabase } from '../services/supabaseClient';

export const generatePDFBase64 = async (
    elementId: string,
    filename: string,
    orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<string | null> => {
    const element = document.getElementById(elementId);
    if (!element) return null;

    const opt = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.85 },
        html2canvas: { scale: 1.5 },
        jsPDF: { unit: 'in', format: 'letter', orientation: orientation as any }
    };

    try {
        // Generate PDF as a Blob
        const pdfBlob: Blob = await html2pdf().set(opt).from(element).outputPdf('blob');

        // Convert Blob to Base64 for transmission over HTTP
        const pdfBase64: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Strip the data:application/pdf;base64, prefix
                resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(pdfBlob);
        });

        return pdfBase64;
    } catch (error) {
        console.error('Error generating PDF base64:', error);
        return null;
    }
};

export const sendEmailWithPDF = async (
    filename: string,
    title: string,
    text: string,
    pdfBase64: string,
    toEmail: string,
    gmailUser: string,
    gmailAppPassword: string
) => {
    if (!supabase) {
        alert('Supabase client is not available.');
        return;
    }

    try {
        const { data, error } = await supabase.functions.invoke('send-report-email', {
            body: {
                toEmails: toEmail,
                subject: title,
                body: text,
                pdfBase64,
                filename,
                gmailUser,
                gmailAppPassword
            },
        });

        if (error) {
            console.error('Edge function error:', error);
            throw error;
        }

        console.log('Email sent successfully via Edge Function', data);
        alert(`Email sent successfully to ${toEmail}!`);
    } catch (error) {
        console.error('Detailed Error object:', error);
        alert(`Error sending email: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        throw error; // Rethrow to let the UI know it failed (if we want to keep modal open, etc)
    }
};
