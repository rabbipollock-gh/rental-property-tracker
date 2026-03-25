import html2pdf from 'html2pdf.js';
import { supabase } from '../services/supabaseClient';

export const generateAndSharePDF = async (
    elementId: string,
    filename: string,
    title: string,
    text: string,
    toEmail: string = ''
) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const opt = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
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

        // If we have a Supabase client and a recipient, try sending via the Edge Function
        if (supabase && toEmail) {
            const { data, error } = await supabase.functions.invoke('send-report-email', {
                body: {
                    toEmails: toEmail,
                    subject: title,
                    body: text,
                    pdfBase64,
                    filename,
                },
            });

            if (error) {
                console.error('Edge function error:', error);
                throw error;
            }

            console.log('Email sent successfully via Edge Function', data);
            alert(`Email sent successfully to ${toEmail}!`);
            return;
        }

        // Fallback: if no Supabase or no email, try native share sheet (Mac/iOS)
        const isMobileOrApple = navigator.userAgent.toLowerCase().match(/mac|ipad|iphone|android/);
        if (isMobileOrApple && navigator.canShare) {
            const file = new File([pdfBlob], filename, { type: 'application/pdf' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title, text });
                return;
            }
        }

        // Final fallback: download the PDF and open mailto
        html2pdf().set(opt).from(element).save();
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(`${text}\n\n(PDF has been downloaded - please attach it to this email before sending.)`);
        const to = toEmail ? encodeURIComponent(toEmail) : '';
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;

    } catch (error) {
        console.error('Error generating or sharing PDF:', error);
        alert('Could not send the email. Downloading the PDF instead...');
        html2pdf().set(opt).from(element).save();
    }
};
