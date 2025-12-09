import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import HRRequests from './pages/HRRequests';
import Contents from './pages/Contents';
import Ideas from './pages/Ideas';
import Suggestions from './pages/Suggestions';
import Recognition from './pages/Recognition';
import Admin from './pages/Admin';
import Tickets from './pages/Tickets';
import Contacts from './pages/Contacts';
import MQNews from './pages/MQNews';
import CustomForms from './pages/CustomForms';
import AnonymousComplaint from './pages/AnonymousComplaint';
import Messaging from './pages/Messaging';
import HRDashboard from './pages/HRDashboard';
import PerformanceReviews from './pages/PerformanceReviews';
import Manuals from './pages/Manuals';
import VacationManagement from './pages/VacationManagement';
import RecruitmentKanban from './pages/RecruitmentKanban';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Announcements": Announcements,
    "HRRequests": HRRequests,
    "Contents": Contents,
    "Ideas": Ideas,
    "Suggestions": Suggestions,
    "Recognition": Recognition,
    "Admin": Admin,
    "Tickets": Tickets,
    "Contacts": Contacts,
    "MQNews": MQNews,
    "CustomForms": CustomForms,
    "AnonymousComplaint": AnonymousComplaint,
    "Messaging": Messaging,
    "HRDashboard": HRDashboard,
    "PerformanceReviews": PerformanceReviews,
    "Manuals": Manuals,
    "VacationManagement": VacationManagement,
    "RecruitmentKanban": RecruitmentKanban,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};