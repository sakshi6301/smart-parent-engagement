import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      dashboard: 'Dashboard', attendance: 'Attendance', grades: 'Grades',
      homework: 'Homework', notifications: 'Notifications', chat: 'Chat',
      feedback: 'Feedback', logout: 'Logout', students: 'Students',
      welcome: 'Welcome', risk: 'Risk Level', engagement: 'Engagement Score',
      present: 'Present', absent: 'Absent', submit: 'Submit', send: 'Send',
    }
  },
  hi: {
    translation: {
      dashboard: 'डैशबोर्ड', attendance: 'उपस्थिति', grades: 'ग्रेड',
      homework: 'गृहकार्य', notifications: 'सूचनाएं', chat: 'चैट',
      feedback: 'प्रतिक्रिया', logout: 'लॉग आउट', students: 'छात्र',
      welcome: 'स्वागत है', risk: 'जोखिम स्तर', engagement: 'सहभागिता स्कोर',
      present: 'उपस्थित', absent: 'अनुपस्थित', submit: 'जमा करें', send: 'भेजें',
    }
  },
  mr: {
    translation: {
      dashboard: 'डॅशबोर्ड', attendance: 'उपस्थिती', grades: 'गुण',
      homework: 'गृहपाठ', notifications: 'सूचना', chat: 'चॅट',
      feedback: 'अभिप्राय', logout: 'बाहेर पडा', students: 'विद्यार्थी',
      welcome: 'स्वागत आहे', risk: 'धोका पातळी', engagement: 'सहभाग गुण',
      present: 'उपस्थित', absent: 'अनुपस्थित', submit: 'सादर करा', send: 'पाठवा',
    }
  }
};

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources, fallbackLng: 'en', interpolation: { escapeValue: false }
});

export default i18n;
