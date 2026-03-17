import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Nav
      dashboard: 'Dashboard', attendance: 'Attendance', grades: 'Grades',
      homework: 'Homework', notifications: 'Notifications', chat: 'Chat',
      feedback: 'Feedback', logout: 'Logout', students: 'Students',
      teachers: 'Teachers', parents: 'Parents', meetings: 'Meetings',
      analytics: 'Analytics', settings: 'Settings', profile: 'Profile',
      aiRiskMonitor: 'AI Risk Monitor', aiModel: 'AI Model', bulkImport: 'Bulk Import',
      userManagement: 'User Management', linkManagement: 'Link Management',
      myGrades: 'My Grades', myHomework: 'My Homework', myAttendance: 'My Attendance',
      aiStudyTips: 'AI Study Tips', chatWithTeacher: 'Chat with Teacher',
      performance: 'Performance',

      // Common
      welcome: 'Welcome', submit: 'Submit', send: 'Send', save: 'Save',
      cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add',
      search: 'Search', filter: 'Filter', export: 'Export', import: 'Import',
      loading: 'Loading...', noData: 'No data found', error: 'Error',
      success: 'Success', confirm: 'Confirm', close: 'Close', back: 'Back',
      refresh: 'Refresh', view: 'View', download: 'Download', upload: 'Upload',
      name: 'Name', email: 'Email', phone: 'Phone', class: 'Class',
      section: 'Section', subject: 'Subject', date: 'Date', status: 'Status',
      actions: 'Actions', total: 'Total', average: 'Average', score: 'Score',

      // Attendance
      present: 'Present', absent: 'Absent', late: 'Late',
      markAttendance: 'Mark Attendance', attendanceMarked: 'Attendance marked successfully',
      todayAttendance: "Today's Attendance", attendancePct: 'Attendance %',
      absentAlert: 'Absent Alert', attendanceHistory: 'Attendance History',

      // Grades
      addGrade: 'Add Grade', gradeAdded: 'Grade added successfully',
      examType: 'Exam Type', maxMarks: 'Max Marks', marksObtained: 'Marks Obtained',
      percentage: 'Percentage', gradeHistory: 'Grade History', subjectPerformance: 'Subject Performance',
      improving: 'Improving', declining: 'Declining', stable: 'Stable',

      // Homework
      assignHomework: 'Assign Homework', submitHomework: 'Submit Homework',
      dueDate: 'Due Date', description: 'Description', title: 'Title',
      pending: 'Pending', submitted: 'Submitted', overdue: 'Overdue',
      dueToday: 'Due today!', dueTomorrow: 'Due tomorrow!',
      attachFile: 'Attach file (optional)', submitting: 'Submitting...',
      homeworkSubmitted: 'Homework submitted!', noHomework: 'No homework found',
      noPending: 'No pending homework!', noOverdue: 'No overdue homework!',

      // Notifications
      sendNotification: 'Send Notification', notificationSent: 'Notification sent',
      markAllRead: 'Mark all as read', noNotifications: 'No notifications',
      pushNotification: 'Push Notification', emailNotification: 'Email Notification',

      // Chat
      typeMessage: 'Type a message...', noMessages: 'No messages yet',
      startConversation: 'Start a conversation', online: 'Online', offline: 'Offline',

      // Meetings
      requestMeeting: 'Request Meeting', meetingRequested: 'Meeting requested',
      scheduledFor: 'Scheduled for', pendingMeetings: 'Pending Meetings',
      acceptMeeting: 'Accept', rejectMeeting: 'Reject', meetingReason: 'Reason',
      proposedDate: 'Proposed Date',

      // AI
      riskLevel: 'Risk Level', highRisk: 'High Risk', mediumRisk: 'Medium Risk',
      lowRisk: 'Low Risk', confidence: 'Confidence', riskPrediction: 'Risk Prediction',
      gradeTrend: 'Grade Trend', attendanceAnomaly: 'Attendance Anomaly',
      engagement: 'Engagement Score', recommendations: 'Recommendations',
      anomalyDetected: 'Anomaly Detected', normalPattern: 'Normal Pattern',

      // Admin
      totalStudents: 'Total Students', totalTeachers: 'Total Teachers',
      totalParents: 'Total Parents', recentStudents: 'Recently Added Students',
      quickActions: 'Quick Actions', genderDistribution: 'Gender Distribution',
      classDistribution: 'Class-wise Students', monthlyTrend: 'Monthly Attendance Trend',
      subjectPerf: 'Subject-wise Performance', teacherWorkload: 'Teacher Workload',
      uploadCSV: 'Upload CSV', retrainModel: 'Retrain Model',
      modelAccuracy: 'Model Accuracy', trainingSamples: 'Training Samples',
      dataSource: 'Data Source', syntheticData: 'Synthetic Data', realData: 'Real School Data',

      // Auth
      login: 'Login', loginTitle: 'Sign in to SCOPE', emailPlaceholder: 'Enter your email',
      passwordPlaceholder: 'Enter your password', loggingIn: 'Signing in...',
      invalidCredentials: 'Invalid email or password',

      // Feedback
      submitFeedback: 'Submit Feedback', feedbackType: 'Feedback Type',
      feedbackMessage: 'Your message', feedbackSubmitted: 'Feedback submitted. Thank you!',
      complaint: 'Complaint', suggestion: 'Suggestion', appreciation: 'Appreciation',
    }
  },
  hi: {
    translation: {
      // Nav
      dashboard: 'डैशबोर्ड', attendance: 'उपस्थिति', grades: 'ग्रेड',
      homework: 'गृहकार्य', notifications: 'सूचनाएं', chat: 'चैट',
      feedback: 'प्रतिक्रिया', logout: 'लॉग आउट', students: 'छात्र',
      teachers: 'शिक्षक', parents: 'अभिभावक', meetings: 'बैठकें',
      analytics: 'विश्लेषण', settings: 'सेटिंग्स', profile: 'प्रोफ़ाइल',
      aiRiskMonitor: 'AI जोखिम मॉनिटर', aiModel: 'AI मॉडल', bulkImport: 'बल्क आयात',
      userManagement: 'उपयोगकर्ता प्रबंधन', linkManagement: 'लिंक प्रबंधन',
      myGrades: 'मेरे ग्रेड', myHomework: 'मेरा गृहकार्य', myAttendance: 'मेरी उपस्थिति',
      aiStudyTips: 'AI अध्ययन सुझाव', chatWithTeacher: 'शिक्षक से चैट',
      performance: 'प्रदर्शन',

      // Common
      welcome: 'स्वागत है', submit: 'जमा करें', send: 'भेजें', save: 'सहेजें',
      cancel: 'रद्द करें', delete: 'हटाएं', edit: 'संपादित करें', add: 'जोड़ें',
      search: 'खोजें', filter: 'फ़िल्टर', export: 'निर्यात', import: 'आयात',
      loading: 'लोड हो रहा है...', noData: 'कोई डेटा नहीं मिला', error: 'त्रुटि',
      success: 'सफलता', confirm: 'पुष्टि करें', close: 'बंद करें', back: 'वापस',
      refresh: 'रीफ्रेश', view: 'देखें', download: 'डाउनलोड', upload: 'अपलोड',
      name: 'नाम', email: 'ईमेल', phone: 'फ़ोन', class: 'कक्षा',
      section: 'अनुभाग', subject: 'विषय', date: 'तारीख', status: 'स्थिति',
      actions: 'कार्रवाई', total: 'कुल', average: 'औसत', score: 'अंक',

      // Attendance
      present: 'उपस्थित', absent: 'अनुपस्थित', late: 'देर से',
      markAttendance: 'उपस्थिति दर्ज करें', attendanceMarked: 'उपस्थिति सफलतापूर्वक दर्ज की गई',
      todayAttendance: 'आज की उपस्थिति', attendancePct: 'उपस्थिति %',
      absentAlert: 'अनुपस्थिति अलर्ट', attendanceHistory: 'उपस्थिति इतिहास',

      // Grades
      addGrade: 'ग्रेड जोड़ें', gradeAdded: 'ग्रेड सफलतापूर्वक जोड़ा गया',
      examType: 'परीक्षा प्रकार', maxMarks: 'अधिकतम अंक', marksObtained: 'प्राप्त अंक',
      percentage: 'प्रतिशत', gradeHistory: 'ग्रेड इतिहास', subjectPerformance: 'विषय प्रदर्शन',
      improving: 'सुधार हो रहा है', declining: 'गिरावट', stable: 'स्थिर',

      // Homework
      assignHomework: 'गृहकार्य सौंपें', submitHomework: 'गृहकार्य जमा करें',
      dueDate: 'अंतिम तिथि', description: 'विवरण', title: 'शीर्षक',
      pending: 'लंबित', submitted: 'जमा किया', overdue: 'समय सीमा पार',
      dueToday: 'आज देय है!', dueTomorrow: 'कल देय है!',
      attachFile: 'फ़ाइल संलग्न करें (वैकल्पिक)', submitting: 'जमा हो रहा है...',
      homeworkSubmitted: 'गृहकार्य जमा हो गया!', noHomework: 'कोई गृहकार्य नहीं मिला',
      noPending: 'कोई लंबित गृहकार्य नहीं!', noOverdue: 'कोई अतिदेय गृहकार्य नहीं!',

      // Notifications
      sendNotification: 'सूचना भेजें', notificationSent: 'सूचना भेजी गई',
      markAllRead: 'सभी पढ़े हुए चिह्नित करें', noNotifications: 'कोई सूचना नहीं',
      pushNotification: 'पुश सूचना', emailNotification: 'ईमेल सूचना',

      // Chat
      typeMessage: 'संदेश लिखें...', noMessages: 'अभी तक कोई संदेश नहीं',
      startConversation: 'बातचीत शुरू करें', online: 'ऑनलाइन', offline: 'ऑफलाइन',

      // Meetings
      requestMeeting: 'बैठक का अनुरोध करें', meetingRequested: 'बैठक का अनुरोध किया गया',
      scheduledFor: 'के लिए निर्धारित', pendingMeetings: 'लंबित बैठकें',
      acceptMeeting: 'स्वीकार करें', rejectMeeting: 'अस्वीकार करें',
      meetingReason: 'कारण', proposedDate: 'प्रस्तावित तिथि',

      // AI
      riskLevel: 'जोखिम स्तर', highRisk: 'उच्च जोखिम', mediumRisk: 'मध्यम जोखिम',
      lowRisk: 'कम जोखिम', confidence: 'विश्वास', riskPrediction: 'जोखिम पूर्वानुमान',
      gradeTrend: 'ग्रेड प्रवृत्ति', attendanceAnomaly: 'उपस्थिति विसंगति',
      engagement: 'सहभागिता स्कोर', recommendations: 'सिफारिशें',
      anomalyDetected: 'विसंगति पाई गई', normalPattern: 'सामान्य पैटर्न',

      // Admin
      totalStudents: 'कुल छात्र', totalTeachers: 'कुल शिक्षक',
      totalParents: 'कुल अभिभावक', recentStudents: 'हाल ही में जोड़े गए छात्र',
      quickActions: 'त्वरित कार्रवाई', genderDistribution: 'लिंग वितरण',
      classDistribution: 'कक्षावार छात्र', monthlyTrend: 'मासिक उपस्थिति प्रवृत्ति',
      subjectPerf: 'विषयवार प्रदर्शन', teacherWorkload: 'शिक्षक कार्यभार',
      uploadCSV: 'CSV अपलोड करें', retrainModel: 'मॉडल पुनः प्रशिक्षित करें',
      modelAccuracy: 'मॉडल सटीकता', trainingSamples: 'प्रशिक्षण नमूने',
      dataSource: 'डेटा स्रोत', syntheticData: 'सिंथेटिक डेटा', realData: 'वास्तविक स्कूल डेटा',

      // Auth
      login: 'लॉगिन', loginTitle: 'SCOPE में साइन इन करें',
      emailPlaceholder: 'अपना ईमेल दर्ज करें', passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
      loggingIn: 'साइन इन हो रहा है...', invalidCredentials: 'अमान्य ईमेल या पासवर्ड',

      // Feedback
      submitFeedback: 'प्रतिक्रिया जमा करें', feedbackType: 'प्रतिक्रिया प्रकार',
      feedbackMessage: 'आपका संदेश', feedbackSubmitted: 'प्रतिक्रिया जमा हो गई। धन्यवाद!',
      complaint: 'शिकायत', suggestion: 'सुझाव', appreciation: 'प्रशंसा',
    }
  },
  mr: {
    translation: {
      // Nav
      dashboard: 'डॅशबोर्ड', attendance: 'उपस्थिती', grades: 'गुण',
      homework: 'गृहपाठ', notifications: 'सूचना', chat: 'चॅट',
      feedback: 'अभिप्राय', logout: 'बाहेर पडा', students: 'विद्यार्थी',
      teachers: 'शिक्षक', parents: 'पालक', meetings: 'बैठका',
      analytics: 'विश्लेषण', settings: 'सेटिंग्ज', profile: 'प्रोफाइल',
      aiRiskMonitor: 'AI धोका मॉनिटर', aiModel: 'AI मॉडेल', bulkImport: 'बल्क आयात',
      userManagement: 'वापरकर्ता व्यवस्थापन', linkManagement: 'लिंक व्यवस्थापन',
      myGrades: 'माझे गुण', myHomework: 'माझा गृहपाठ', myAttendance: 'माझी उपस्थिती',
      aiStudyTips: 'AI अभ्यास सूचना', chatWithTeacher: 'शिक्षकांशी चॅट',
      performance: 'कामगिरी',

      // Common
      welcome: 'स्वागत आहे', submit: 'सादर करा', send: 'पाठवा', save: 'जतन करा',
      cancel: 'रद्द करा', delete: 'हटवा', edit: 'संपादित करा', add: 'जोडा',
      search: 'शोधा', filter: 'फिल्टर', export: 'निर्यात', import: 'आयात',
      loading: 'लोड होत आहे...', noData: 'कोणताही डेटा आढळला नाही', error: 'त्रुटी',
      success: 'यश', confirm: 'पुष्टी करा', close: 'बंद करा', back: 'मागे',
      refresh: 'रिफ्रेश', view: 'पहा', download: 'डाउनलोड', upload: 'अपलोड',
      name: 'नाव', email: 'ईमेल', phone: 'फोन', class: 'वर्ग',
      section: 'विभाग', subject: 'विषय', date: 'तारीख', status: 'स्थिती',
      actions: 'क्रिया', total: 'एकूण', average: 'सरासरी', score: 'गुण',

      // Attendance
      present: 'उपस्थित', absent: 'अनुपस्थित', late: 'उशिरा',
      markAttendance: 'उपस्थिती नोंदवा', attendanceMarked: 'उपस्थिती यशस्वीरित्या नोंदवली',
      todayAttendance: 'आजची उपस्थिती', attendancePct: 'उपस्थिती %',
      absentAlert: 'अनुपस्थिती सूचना', attendanceHistory: 'उपस्थिती इतिहास',

      // Grades
      addGrade: 'गुण जोडा', gradeAdded: 'गुण यशस्वीरित्या जोडले',
      examType: 'परीक्षा प्रकार', maxMarks: 'कमाल गुण', marksObtained: 'मिळालेले गुण',
      percentage: 'टक्केवारी', gradeHistory: 'गुण इतिहास', subjectPerformance: 'विषय कामगिरी',
      improving: 'सुधारत आहे', declining: 'घसरत आहे', stable: 'स्थिर',

      // Homework
      assignHomework: 'गृहपाठ द्या', submitHomework: 'गृहपाठ सादर करा',
      dueDate: 'अंतिम तारीख', description: 'वर्णन', title: 'शीर्षक',
      pending: 'प्रलंबित', submitted: 'सादर केले', overdue: 'मुदत संपली',
      dueToday: 'आज द्यायचे आहे!', dueTomorrow: 'उद्या द्यायचे आहे!',
      attachFile: 'फाइल जोडा (पर्यायी)', submitting: 'सादर होत आहे...',
      homeworkSubmitted: 'गृहपाठ सादर झाला!', noHomework: 'कोणताही गृहपाठ आढळला नाही',
      noPending: 'कोणताही प्रलंबित गृहपाठ नाही!', noOverdue: 'कोणताही मुदत संपलेला गृहपाठ नाही!',

      // Notifications
      sendNotification: 'सूचना पाठवा', notificationSent: 'सूचना पाठवली',
      markAllRead: 'सर्व वाचले म्हणून चिन्हांकित करा', noNotifications: 'कोणत्याही सूचना नाहीत',
      pushNotification: 'पुश सूचना', emailNotification: 'ईमेल सूचना',

      // Chat
      typeMessage: 'संदेश लिहा...', noMessages: 'अद्याप कोणतेही संदेश नाहीत',
      startConversation: 'संभाषण सुरू करा', online: 'ऑनलाइन', offline: 'ऑफलाइन',

      // Meetings
      requestMeeting: 'बैठकीची विनंती करा', meetingRequested: 'बैठकीची विनंती केली',
      scheduledFor: 'साठी नियोजित', pendingMeetings: 'प्रलंबित बैठका',
      acceptMeeting: 'स्वीकारा', rejectMeeting: 'नाकारा',
      meetingReason: 'कारण', proposedDate: 'प्रस्तावित तारीख',

      // AI
      riskLevel: 'धोका पातळी', highRisk: 'उच्च धोका', mediumRisk: 'मध्यम धोका',
      lowRisk: 'कमी धोका', confidence: 'विश्वास', riskPrediction: 'धोका अंदाज',
      gradeTrend: 'गुण कल', attendanceAnomaly: 'उपस्थिती विसंगती',
      engagement: 'सहभाग गुण', recommendations: 'शिफारसी',
      anomalyDetected: 'विसंगती आढळली', normalPattern: 'सामान्य नमुना',

      // Admin
      totalStudents: 'एकूण विद्यार्थी', totalTeachers: 'एकूण शिक्षक',
      totalParents: 'एकूण पालक', recentStudents: 'नुकतेच जोडलेले विद्यार्थी',
      quickActions: 'जलद क्रिया', genderDistribution: 'लिंग वितरण',
      classDistribution: 'वर्गनिहाय विद्यार्थी', monthlyTrend: 'मासिक उपस्थिती कल',
      subjectPerf: 'विषयनिहाय कामगिरी', teacherWorkload: 'शिक्षक कामाचा भार',
      uploadCSV: 'CSV अपलोड करा', retrainModel: 'मॉडेल पुन्हा प्रशिक्षित करा',
      modelAccuracy: 'मॉडेल अचूकता', trainingSamples: 'प्रशिक्षण नमुने',
      dataSource: 'डेटा स्रोत', syntheticData: 'कृत्रिम डेटा', realData: 'वास्तविक शाळा डेटा',

      // Auth
      login: 'लॉगिन', loginTitle: 'SCOPE मध्ये साइन इन करा',
      emailPlaceholder: 'तुमचा ईमेल प्रविष्ट करा', passwordPlaceholder: 'तुमचा पासवर्ड प्रविष्ट करा',
      loggingIn: 'साइन इन होत आहे...', invalidCredentials: 'अवैध ईमेल किंवा पासवर्ड',

      // Feedback
      submitFeedback: 'अभिप्राय सादर करा', feedbackType: 'अभिप्राय प्रकार',
      feedbackMessage: 'तुमचा संदेश', feedbackSubmitted: 'अभिप्राय सादर झाला. धन्यवाद!',
      complaint: 'तक्रार', suggestion: 'सूचना', appreciation: 'कौतुक',
    }
  }
};

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources, fallbackLng: 'en', interpolation: { escapeValue: false }
});

export default i18n;
